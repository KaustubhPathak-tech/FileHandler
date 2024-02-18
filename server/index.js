// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const WebSocket = require("ws");
const fs = require("fs");
const dotenv = require("dotenv");
const { promisify } = require("util");
const app = express();
dotenv.config();
const PORT = process.env.PORT || 5000;
const wss = new WebSocket.Server({ port: 8080 });

app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

const fileSchema = new mongoose.Schema({
  filename: String,
  path: String,
  originalname: String,
  mimetype: String,
  isPublished: {
    type: Boolean,
    default: false,
  },
});

const File = mongoose.model("File", fileSchema);

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json("Please upload a file!");
    }
    const { filename, path, originalname, mimetype } = req.file;
    const file = new File({
      filename,
      path,
      originalname,
      mimetype,
    });
    await file.save();
    res.send("File uploaded successfully!");
  } catch (error) {
    console.error("Error uploading file: ", error);
    res.status(500).send("Error uploading file");
  }
});

app.get("/files", async (req, res) => {
  try {
    const files = await File.find();
    res.json(files);
  } catch (error) {
    console.error("Error fetching files: ", error);
    res.status(500).send("Error fetching files");
  }
});

app.post("/publish", async (req, res) => {
  const fileId = req.body.fileId;
  try {
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }

    file.isPublished = true;
    await file.save();

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event: "filePublished" }));
      }
    });

    return res.status(200).json({ message: "File published successfully" });
  } catch (error) {
    console.error("Error publishing file:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});
app.post("/unpublish", async (req, res) => {
  const fileId = req.body.fileId;
  try {
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    file.isPublished = false;
    await file.save();
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event2: "fileUnPublished" }));
      }
    });
    return res.status(200).json({ message: "File Unpublished successfully" });
  } catch (error) {
    console.error("Error publishing file:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

const cron = require("node-cron");

cron.schedule("*/15 * * * *", () => {
  console.log("UPDATING");
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event2: "fileUnPublished" }));
    }
  });
});

wss.on("connection", (ws) => {
  console.log("WebSocket connection established!");

  ws.on("close", () => {
    console.log("WebSocket connection closed!");
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

process.on("SIGINT", () => {
  db.close(() => {
    console.log("MongoDB disconnected through app termination");
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

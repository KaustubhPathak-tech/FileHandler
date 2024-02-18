// server.js
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const WebSocket = require('ws');
const fs = require("fs");
const { promisify } = require("util");
const MulterAzureStorage = require('multer-azure-blob-storage').MulterAzureStorage;

const dotenv = require("dotenv");


const app = express();
const PORT = process.env.PORT || 5000;
const wss = new WebSocket.Server({ port: 8080 }); 

dotenv.config();

app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Replace * with the appropriate origin if you want to restrict it
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Connect to MongoDB
mongoose.connect(
  "mongodb+srv://Admin:SKA9A1LD1ZRnpmZg@stack-overflow-clone.kbyvwka.mongodb.net/Molog"
);
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



const resolveMetadata = (req, file) => {
    return new Promise((resolve, reject) => {
        const metadata = {author: "Kaustubh Pathak", album: "files"};
        resolve(metadata);
    });
};


const azureStorage = new MulterAzureStorage({
    connectionString: 'DefaultEndpointsProtocol=https;AccountName=csg100320031db55cae;AccountKey=wxRhUy2SPAYQaJxzBg48tqtKjenX7/2XDCQxibyWPUgoPrSojsctCpi6xJH2cvp/hVpGCSE7oOBB+AStp7a9iA==;EndpointSuffix=core.windows.net',
    accessKey: 'wxRhUy2SPAYQaJxzBg48tqtKjenX7/2XDCQxibyWPUgoPrSojsctCpi6xJH2cvp/hVpGCSE7oOBB+AStp7a9iA==',
    accountName:'csg100320031db55cae',
    containerName: 'documents',
    metadata: resolveMetadata,
});

const upload = multer({
  storage: azureStorage,
      limits: {
      fileSize: 1024 * 1024 * 100, // Adjust the file size limit as needed (100MB in this example)
  },
});

app.get("/",(req,res)=>{
      res.send("io server is running")
});

app.post("/upload", upload.single("file"), async (req, res) => {
try {
  if(!req.file){
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
      return res.status(404).json({ error: 'File not found' });
    }

    file.isPublished = true;
    await file.save();


    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event: 'filePublished' }));
      }
    });

    return res.status(200).json({ message: 'File published successfully' });
  } catch (error) {
    console.error('Error publishing file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
app.post("/unpublish", async (req, res) => {
  const fileId = req.body.fileId;
  try {
    const file = await File.findById(fileId);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    file.isPublished = false;
    await file.save();
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ event2: 'fileUnPublished' }));
      }
    });
    return res.status(200).json({ message: 'File Unpublished successfully' });
  } catch (error) {
    console.error('Error publishing file:', error);
    return res.status(500).json({ error: 'Internal server error' });
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

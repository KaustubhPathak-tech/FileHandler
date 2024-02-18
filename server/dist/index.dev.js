"use strict";

// server.js
var express = require("express");

var cors = require("cors");

var mongoose = require("mongoose");

var multer = require("multer");

var WebSocket = require('ws');

var fs = require("fs");

var _require = require("util"),
    promisify = _require.promisify;

var MulterAzureStorage = require('multer-azure-blob-storage').MulterAzureStorage;

var dotenv = require("dotenv");

var app = express();
var PORT = process.env.PORT || 5000;
var wss = new WebSocket.Server({
  port: 8080
});
dotenv.config();
app.use(express.json({
  limit: "30mb",
  extended: true
}));
app.use(express.urlencoded({
  limit: "30mb",
  extended: true
}));
app.use(cors());
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*'); // Replace * with the appropriate origin if you want to restrict it

  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}); // Connect to MongoDB

mongoose.connect("mongodb+srv://Admin:SKA9A1LD1ZRnpmZg@stack-overflow-clone.kbyvwka.mongodb.net/Molog");
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
var fileSchema = new mongoose.Schema({
  filename: String,
  path: String,
  originalname: String,
  mimetype: String,
  isPublished: {
    type: Boolean,
    "default": false
  }
});
var File = mongoose.model("File", fileSchema);

var resolveMetadata = function resolveMetadata(req, file) {
  return new Promise(function (resolve, reject) {
    var metadata = {
      author: "Kaustubh Pathak",
      album: "files"
    };
    resolve(metadata);
  });
};

var azureStorage = new MulterAzureStorage({
  connectionString: 'DefaultEndpointsProtocol=https;AccountName=csg100320031db55cae;AccountKey=wxRhUy2SPAYQaJxzBg48tqtKjenX7/2XDCQxibyWPUgoPrSojsctCpi6xJH2cvp/hVpGCSE7oOBB+AStp7a9iA==;EndpointSuffix=core.windows.net',
  accessKey: 'wxRhUy2SPAYQaJxzBg48tqtKjenX7/2XDCQxibyWPUgoPrSojsctCpi6xJH2cvp/hVpGCSE7oOBB+AStp7a9iA==',
  accountName: 'csg100320031db55cae',
  containerName: 'documents',
  metadata: resolveMetadata
});
var upload = multer({
  storage: azureStorage,
  limits: {
    fileSize: 1024 * 1024 * 100 // Adjust the file size limit as needed (100MB in this example)

  }
});
app.get("/", function (req, res) {
  res.send("io server is running");
});
app.post("/upload", upload.single("file"), function _callee(req, res) {
  var _req$file, filename, path, originalname, mimetype, file;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;

          if (req.file) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return", res.status(400).json("Please upload a file!"));

        case 3:
          _req$file = req.file, filename = _req$file.filename, path = _req$file.path, originalname = _req$file.originalname, mimetype = _req$file.mimetype;
          file = new File({
            filename: filename,
            path: path,
            originalname: originalname,
            mimetype: mimetype
          });
          _context.next = 7;
          return regeneratorRuntime.awrap(file.save());

        case 7:
          res.send("File uploaded successfully!");
          _context.next = 14;
          break;

        case 10:
          _context.prev = 10;
          _context.t0 = _context["catch"](0);
          console.error("Error uploading file: ", _context.t0);
          res.status(500).send("Error uploading file");

        case 14:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 10]]);
});
app.get("/files", function _callee2(req, res) {
  var files;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(File.find());

        case 3:
          files = _context2.sent;
          res.json(files);
          _context2.next = 11;
          break;

        case 7:
          _context2.prev = 7;
          _context2.t0 = _context2["catch"](0);
          console.error("Error fetching files: ", _context2.t0);
          res.status(500).send("Error fetching files");

        case 11:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 7]]);
});
app.post("/publish", function _callee3(req, res) {
  var fileId, file;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          fileId = req.body.fileId;
          _context3.prev = 1;
          _context3.next = 4;
          return regeneratorRuntime.awrap(File.findById(fileId));

        case 4:
          file = _context3.sent;

          if (file) {
            _context3.next = 7;
            break;
          }

          return _context3.abrupt("return", res.status(404).json({
            error: 'File not found'
          }));

        case 7:
          file.isPublished = true;
          _context3.next = 10;
          return regeneratorRuntime.awrap(file.save());

        case 10:
          wss.clients.forEach(function (client) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                event: 'filePublished'
              }));
            }
          });
          return _context3.abrupt("return", res.status(200).json({
            message: 'File published successfully'
          }));

        case 14:
          _context3.prev = 14;
          _context3.t0 = _context3["catch"](1);
          console.error('Error publishing file:', _context3.t0);
          return _context3.abrupt("return", res.status(500).json({
            error: 'Internal server error'
          }));

        case 18:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[1, 14]]);
});
app.post("/unpublish", function _callee4(req, res) {
  var fileId, file;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          fileId = req.body.fileId;
          _context4.prev = 1;
          _context4.next = 4;
          return regeneratorRuntime.awrap(File.findById(fileId));

        case 4:
          file = _context4.sent;

          if (file) {
            _context4.next = 7;
            break;
          }

          return _context4.abrupt("return", res.status(404).json({
            error: 'File not found'
          }));

        case 7:
          file.isPublished = false;
          _context4.next = 10;
          return regeneratorRuntime.awrap(file.save());

        case 10:
          wss.clients.forEach(function (client) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                event2: 'fileUnPublished'
              }));
            }
          });
          return _context4.abrupt("return", res.status(200).json({
            message: 'File Unpublished successfully'
          }));

        case 14:
          _context4.prev = 14;
          _context4.t0 = _context4["catch"](1);
          console.error('Error publishing file:', _context4.t0);
          return _context4.abrupt("return", res.status(500).json({
            error: 'Internal server error'
          }));

        case 18:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[1, 14]]);
});

var cron = require("node-cron");

cron.schedule("*/15 * * * *", function () {
  console.log("UPDATING");
  wss.clients.forEach(function (client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        event2: "fileUnPublished"
      }));
    }
  });
});
wss.on("connection", function (ws) {
  console.log("WebSocket connection established!");
  ws.on("close", function () {
    console.log("WebSocket connection closed!");
  });
});
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});
process.on("SIGINT", function () {
  db.close(function () {
    console.log("MongoDB disconnected through app termination");
    process.exit(0);
  });
});
app.listen(PORT, function () {
  console.log("Server is running on port ".concat(PORT));
});
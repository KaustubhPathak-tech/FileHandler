import React, { useState, useEffect } from "react";
import axios from "axios";

const FileList = () => {
  const [files, setFiles] = useState([]);
  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("WebSocket connection established!");
    };

    socket.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      if (message.event === "filePublished"||"fileUnPublished") {
        console.log("Files updated!");
        const response = await axios.get("http://localhost:5000/files");
        setFiles(response.data);
      }
    };

    return () => {
      socket.close();
    };
  }, []); 

  useEffect(() => {
    const fetchFiles = async () => {
      const response = await axios.get("http://localhost:5000/files");
      setFiles(response.data);
    };

    fetchFiles();
  }, []);

  return (
    <div>
      <h1 className="font-serif text-xl text-center mb-5 font-semibold bg-gradient-to-r from-red-800 to-blue-600 bg-clip-text text-transparent">Published File List</h1>
      <ul>
        {files.map((file) => (
          <li key={file._id}>{file.isPublished && <>{file.filename}</>}</li>
        ))}
      </ul>
    </div>
  );
};

export default FileList;

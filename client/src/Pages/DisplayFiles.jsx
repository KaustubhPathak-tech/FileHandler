// DisplayFiles.js
import React, { useEffect, useState } from "react";
import axios from "axios";

const DisplayFiles = () => {
  const [files, setFiles] = useState([]);

  const handlePublish = (file) => async () => {
    const fileId = file._id;
    try {
      await axios
        .post(
          "https://filehandler.centralindia.cloudapp.azure.com/publish",
          { fileId },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then((res) => {
          alert(res.data.message);
        });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };
  const handleUnPublish = (file) => async () => {
    const fileId = file._id;
    try {
      await axios
        .post(
          "https://filehandler.centralindia.cloudapp.azure.com/unpublish",
          { fileId },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
        .then((res) => {
          alert(res.data.message);
        });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("https://filehandler.centralindia.cloudapp.azure.com/files");
        setFiles(res.data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <h2 className="font-serif text-xl text-center mb-5 font-semibold bg-gradient-to-r from-red-800 to-blue-600 bg-clip-text text-transparent">Uploaded Files</h2>
      <ul>
        {files.map((file, index) => (
          <div key={file._id} className="px-3 py-3">
             {index + 1}.  {file.originalname}
            <button
              onClick={
                file.isPublished ? handleUnPublish(file) : handlePublish(file)
              }
              className="btn"
            >
              {file.isPublished ? <>UnPublish</> : <>Publish</>}
            </button>
          </div>
        ))}
      </ul>
    </div>
  );
};

export default DisplayFiles;

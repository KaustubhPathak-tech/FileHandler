// UploadVideo.js
import React, { useState } from "react";
import axios from "axios";
import DisplayFiles from "./DisplayFiles";

const UploadVideo = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };
  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    if (!file) {
      alert("Please upload a file!");
      return;
    } else {
      const fileExtension = file.name.split(".").pop().toLowerCase();
      const allowedExtensions = [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "webp",
        "mp4",
        "mov",
        "avi",
        "flv",
        "wmv",
      ];

      if (!allowedExtensions.includes(fileExtension)) {
        alert("Please upload an image or video file!");
        window.location.reload();
        return;
      }

      try {
        await axios
          .post("http://localhost:5000/upload", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          })
          .then((res) => {
            alert(res.data);
            window.location.reload();
          });
        setFile(null);
      } catch (error) {
        alert("Error uploading file");
      }
    }
  };

  return (
    <div className="flex justify-center">
      <div className="px-6 py-12 leading-10 text-left ">
        <h2 className="font-serif text-xl text-center mb-5 font-semibold bg-gradient-to-r from-red-800 to-blue-600 bg-clip-text text-transparent">
          Upload Image/Video File
        </h2>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload} className="btn">
          Upload
        </button>
      </div>
      <div className="px-6 py-12 leading-10 text-justify">
        <DisplayFiles />
      </div>
    </div>
  );
};

export default UploadVideo;

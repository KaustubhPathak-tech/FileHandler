// UploadVideo.js
import React, { useState } from "react";
import axios from "axios";
import DisplayFiles from "./DisplayFiles";

const UploadVideo = () => {
  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file.size > 52428800) { // 50 MB in bytes
      alert('File size exceeds the limit. Please choose a smaller file.');
      e.target.value = ''; // Clear file selection
    }
    setFile(e.target.files[0]);
  };
  const handleUpload = async () => {
    console.log("upload clicked");
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
          .post("https://filehandler.centralindia.cloudapp.azure.com/upload", formData, {
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
        console.log(error);
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

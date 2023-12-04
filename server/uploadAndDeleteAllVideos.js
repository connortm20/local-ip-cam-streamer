const fs = require('fs');
const path = require('path');
const uploadToOneDrive = require('./uploadToOneDrive'); // Ensure the path to your 'uploadToOneDrive' module is correct

const UPLOAD_THRESHOLD = 120; // Time in seconds
const tempVidDir = 'tempVids'; // Directory where the video segments are stored

function uploadAndDeleteAllVideos() {
  const now = Date.now(); // Current time

  fs.readdir(tempVidDir, (err, files) => {
    if (err) {
      return console.error('Failed to read directory:', err);
    }
    // Filter for video files and ignore files that are likely still in use by ffmpeg
    const videoFiles = files.filter(file => file.endsWith('.mp4'));

    videoFiles.forEach((filename) => {
      const fullPath = path.join(tempVidDir, filename);
      fs.stat(fullPath, (statErr, stats) => {
        if (statErr) {
          return console.error(`Failed to retrieve stats for file: ${filename}`, statErr);
        }
        // Check if the file has been modified within the upload threshold window
        const lastModified = new Date(stats.mtime).getTime();
        const timeSinceLastModified = (now - lastModified) / 1000; // Convert from milliseconds to seconds

        if (timeSinceLastModified > UPLOAD_THRESHOLD) {
          // File hasn't been modified recently, safe to assume it's complete
          uploadToOneDrive(fullPath) // Replace with your access token if needed
            .then(() => {
              console.log(`Uploaded and deleted video: ${filename}`);
              // Optionally, delete the file after a successful upload
              fs.unlink(fullPath, (unlinkErr) => {
                if (unlinkErr) console.error(`Failed to delete video: ${filename}`, unlinkErr);
              });
            })
            .catch(error => {
              console.error(`Failed to upload/delete video: ${filename}`, error);
            });
        } else {
          console.log(`Skipping upload for ${filename}, file may still be writing.`);
        }
      });
    });
  });
}

module.exports = uploadAndDeleteAllVideos;
const fs = require('fs');
const path = require('path');
const uploadToOneDrive = require('./uploadToOneDrive'); // Ensure the path to your 'uploadToOneDrive' module is correct

const UPLOAD_THRESHOLD = 30; // Time in seconds
const tempVidDir = 'tempVids'; // Directory where the video segments are stored
const yourAccessToken = "EwB4A8l6BAAUAOyDv0l6PcCVu89kmzvqZmkWABkAATC%2bYsWQoHwpPhH2A9sEta1L7jLn4V2QJvPgzPRLDUig8n/I%2bkYKE1RmCaV7Zza5BeWZ%2b3G1MdNfzGTg%2b9D4ZLmYsoz9mfrlUg1EVNpU1eOYQBIbwBMMsncm/L7BxB14scOZLdp1Jo9PtVY72zpE43gaOtBQJXITdweAVCq0BUfY3s/BKpUfTnq7TN9Dwipi894TpVzowF2Klkxjr4W%2bwhyPPko3KcfJ1uV7I5BRVZo/te1T/PRbYcglT5vv%2buOOnaJOFCQnpjEHwpGzOfv2bECRfuk1ZfdIMTBDHJvxfbMIALFA7qQH4r6X86T4lApjOjgvFlmfJTAdjWb74kE5fzcDZgAACC7wc33SWnzXSAJQevtgvxtLzXZ95X8l5y1Yp72UiN2zlxN8JNgHjg6Bq2hVJ10rwiL2RGkUdcT5YdZ%2b%2biwB8db5l0vzFl4XkoUKrOCwnEv7YM6GytKAy0eAjRq%2bqRX3FWAMP9ywEll%2bLjwP0ibCItNLvy4rVRDqtUSeogHMitnG%2b10iNpszg2oo/211ewDmn/pwUWjl0F3tX7kn6XN4Br2o3WtWghhQwnsL9dDfYM5oVJpXcsxv4hLxXc2V4StxWA/5VRaMzA6PWEtK4c1UBPR96iwiEbRh5FDNOzR%2bIXSeQpOUW6hExaRrIIFcZMOGQVtToETW4qD6F5m5CfS5B5r2y3sBE4a4GD8bU9qADD8XDJW2KQN/ujSwaOCHf%2bxQm94l4wIFB9u/2zyy%2bMpoL26fgpHEwpltwUShrHZ46Lj%2bo4qH3KlelGOvPPLd1m0LyFfvD58OzoKp7o8REidMY4%2be/S3wQAc97r%2bT6oDnMrgGwmENtr/F0A2xtEvSH%2bAOgeybx5SVkCp32hqwGu2%2bwm0Xr6OHVVkbP8wU2cSbtAlDCbCaufd1PI2DwMiM7nlErHLAMv6fEI%2bfKXW29KwrcmcSKrZ0eyYmqSubZPWB0Ji5US6TOlhS0PMrP8efPKqbwvox5H4%2bEuETvLUXW5we2/kzjQt9zNh5RjyAnu%2b8APCM1cmnwcO391EsPvirX6GlX9JmgBLwMyIjGRK25o9o3/wOvNQJHiC/JxCYX20z/xZJ%2bpvFJB8WfExghD%2bodgoi5RMl6ROLqEHPWvr8pnqczxfGtXUC"


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
          uploadToOneDrive(fullPath,yourAccessToken) // Replace with your access token if needed
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
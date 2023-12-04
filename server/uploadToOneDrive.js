const onedrive = require('onedrive-api');
const fs = require('fs');

// Exported function to upload a file to OneDrive and delete it locally after
function uploadToOneDrive(filename, accessToken) {
  return new Promise((resolve, reject) => {
    const fullPath = `tempVids/${filename}`;
    // Upload the file to OneDrive
    onedrive.items.uploadSession({
        accessToken: accessToken,
        filename: filename,
        readableStream: fs.createReadStream(fullPath)
    }).then(response => {
        console.log(`Uploaded ${filename} to OneDrive.`);
        // Delete the local file
        fs.unlink(fullPath, (err) => {
            if (err) {
                console.error(`Failed to delete ${filename}: ${err}`);
                reject(err);
            } else {
                console.log(`Successfully deleted ${filename}`);
                resolve(response);
            }
        });
    }).catch(error => {
        console.error(`Upload of ${filename} failed: ${error}`);
        reject(error);
    });
  });
}

module.exports = uploadToOneDrive;
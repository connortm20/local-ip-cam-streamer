const onedrive = require('onedrive-api');
const fs = require('fs');

function uploadToOneDrive(filename, accessToken) {
  return new Promise((resolve, reject) => {
    const fullPath = `${filename}`;
    fs.stat(fullPath, (err, stats) => {
      if (err) {
        console.error(`Failed to retrieve file stats for ${filename}: ${err}`);
        reject(err);
        return;
      }

      onedrive.items.uploadSession({
        accessToken: accessToken,
        filename: filename,
        fileSize: stats.size,
        readableStream: fs.createReadStream(fullPath)
      }).then(response => {
        console.log(`Uploaded ${filename} to OneDrive.`);
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
  });
}

module.exports = uploadToOneDrive;
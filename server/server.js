const fs =require('fs');
const path = require('path');
const express = require('express');
const https = require('https');
//const options = { key: fs.readFileSync('/etc/ssl/localhost+2-key.pem'),
//		  cert: fs.readFileSync('/etc/ssl/localhost+2.pem')};
const options = { key: fs.readFileSync('server.key'),
		  cert: fs.readFileSync('server.crt')};

//manual request for new access
//https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=85065df1-1a3c-466e-a0f9-0ef87e3badda&scope=files.readwrite&response_type=token&redirect_uri=https://localhost:5000/oauth-callback
const yourAccessToken = "EwB4A8l6BAAUAOyDv0l6PcCVu89kmzvqZmkWABkAAbglooOdT7IUvl6Pj4jB5uOE/doLSl66XsEcTZCfDLVUC8L4nQ8a1otygVv9XSwcULNEe9cJGot/m4PA4Vah1Cof%2bfCFAclb/wRUS1Ygtfx9rNCwxXGagt%2b/6IdYLSsYsEP/tjwL6lcrnvf//wwtyKypf/jmNtSavXLegFqPNvnatqeUW8KdOkYr71Z8IrAPk54pAGZUUa8X5obul6uxAz8L96VNqy8CfkZVYJ3w07fDixT%2brO/xBSrW/bC3erTg45beEuQHJNAxxTJqQ9k6q40fNs6389M%2bzQkS6LgGw/iFozc9p3rTd4EFTdFN8ibbeCCpzwH3%2bz3qi1ZoN/nEwpgDZgAACAM8%2buzaT9yxSAKAyt7F6GvieusoxrQjFOIUbvdrF8gNnDDtcCsJv%2btAHgqbeUYoBz4ALgfBSyjBIIbS5MVi3MG/PnGpIF69e/%2bPOG6jZokZrkDxchlc/134aBiT05eP1nPj3jL7Xd4zhextSxkUXKK6oGrUvuJN4TBnfFm1YbqvxrOGRftVPdWgkK8ldaTaba9LAo033b8Nh/ewCq6W3Cj0OdK0XuWn%2blVGtcZgjHewmijGaQuB4J%2bYejh7vWMFa2p/jXHPfTZ5grKcegmIQY9pKqLGspJ8Gl9Eg%2bd0q54WF1PTMESmv%2b1EnyEFd%2bzY1e5zWfesqW8xKIbwwFNE8I0aV6m1CkFF1y%2b/kRDt6GzDkT/5fQkXTubD2BXXuo/1xSqVyy%2bnkkl5XviesgtBcbk4n4NZzS1GBLpIWQVR5tOvjSIVi2oVfviUaVj89ffGvyDHNuwaBrDzAcA0tK77MbZ2TbSaTH66IWiOkZ0M9aloET9FP2i0xXg4g0c6sCDO29ujAj1vsLCvtELvNcM3r4EFzNZ4LS%2bCuJ2jNcJu6P0s3sa3yLhIhF9%2bHts0OPvBh15SC0hr/FDOrWmAl6AAkTfFx4SWsFHWG2CKeW8XmqpMQZ3kxfHorwqaEbhbQTimLOctjbkZa53LB5qRE30VoGHibxtQq65Xaj0ZrqjFslO1wWK1CIwEWN1ctqNAdPXSqS3TH1htSG1y2scKy/e2hM96g6zI6EoVpdzgEPaeFsT4sGwnt5/Wd/Mqc4i6bDcI1NR3adj4oEd61uMui6pJ4K1ybXUC"

const ffmpeg = require('fluent-ffmpeg');

const uploadToOneDrive = require('./uploadToOneDrive');

const app = express();
const server = https.createServer(options, app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  },
  pingTimeout: 5000
});




app.get('/oauth-callback', (req, res) => {
  const token = req.query.token; // Depending on how the token is returned, you may need to adjust this
  if (token) {
    // Save the token for future use (e.g., to the user's session or database)
    // Redirect the user to another page or inform them of successful authentication
    res.redirect('/success-page');
  } else {
    // Handle the error case
    res.redirect('/error-page');
  }
});


function uploadAndDeleteAllVideos() {
  const tempVidDir = 'tempVids';
  fs.readdir(tempVidDir, (err, files) => {
    if (err) {
      return console.error('Failed to read directory:', err);
    }
    // Filter for video files if needed
    const videoFiles = files.filter(file => file.endsWith('.mp4'));

    videoFiles.forEach((filename) => {
      const fullPath = path.join(tempVidDir, filename); // This will create a path like 'tempVids/filename.mp4'
      uploadToOneDrive(fullPath, yourAccessToken).then(() => {
        console.log(`Uploaded and deleted video: ${filename}`);
      }).catch(error => {
        console.error(`Failed to upload/delete video: ${filename}`, error);
      });
    });
  });
}

io.on('connection', (socket) => {
  console.log('a user connected');


  //generate unique connection id
  const clientId = socket.id;
  
  //calls ffmpeg encoding from piped stdin img
  const ffmpegCommand = ffmpeg()
    .input('pipe:0')
    .inputFormat('image2pipe')
    .videoCodec('libx264')
    .size('640x480')
    .outputOptions([
      '-pix_fmt yuv420p',
      '-preset ultrafast',
      '-f segment',
      '-segment_time 10',
      '-reset_timestamps 1',
      '-r 15'
    ])
    .output(`tempVids/output-%03d-${clientId}.mp4`)
    .on('start', (commandLine) => {
      console.log('Spawned ffmpeg with command:', commandLine);
    })
    .on('end', () => {
      uploadAndDeleteAllVideos();
    })
    .on('error', (error, stdout, stderr) => {
      console.error('Error:', error.message);
      console.error('ffmpeg stderr:', stderr);
    })
    .on('close', () => {
      console.log('ffmpeg process finished');
    });

  ffmpegCommand.run();

  socket.on('stream', (data) => {
    const frame = data.split(';base64,').pop();
    const imageBuffer = Buffer.from(frame, 'base64');
    if (ffmpegCommand.ffmpegProc && !ffmpegCommand.ffmpegProc.stdin.destroyed) {
      ffmpegCommand.ffmpegProc.stdin.write(imageBuffer);
    } else {
      console.error('ffmpegProc does not exist or stdin is destroyed');
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (ffmpegCommand.ffmpegProc) {
      ffmpegCommand.ffmpegProc.stdin.end();
    }
    uploadAndDeleteAllVideos();
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

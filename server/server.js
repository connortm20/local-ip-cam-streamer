const fs =require('fs');
const path = require('path');
const express = require('express');
const https = require('https');
const options = { key: fs.readFileSync('/etc/ssl/localhost+2-key.pem'),
		  cert: fs.readFileSync('/etc/ssl/localhost+2.pem')};
/*Replase options with commented ones for testing use of included certs*/
//const options = { key: fs.readFileSync('server.key'),
//		  cert: fs.readFileSync('server.crt')};

//manual request for new access
//tokens need to be manually recieved right now until token refresh endpoints are set up
//https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=85065df1-1a3c-466e-a0f9-0ef87e3badda&scope=files.readwrite&response_type=token&redirect_uri=https://localhost:5000/oauth-callback
const yourAccessToken = "" //needs to be retrieved from above request
const ffmpeg = require('fluent-ffmpeg');


const app = express();
const server = https.createServer(options, app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  },
  pingTimeout: 5000
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
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


const uploadAndDeleteAllVideos = require("./uploadAndDeleteAllVideos.js");
//run the uploader every 2 minutes
const uploadInterval = setInterval(() => {
  uploadAndDeleteAllVideos();
}, 120000);

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
      '-r 30'
    ])
    .output(`tempVids/output-%03d-${clientId}.mp4`)
    .on('start', (commandLine) => {
      console.log('Spawned ffmpeg with command:', commandLine);
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
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT,'0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

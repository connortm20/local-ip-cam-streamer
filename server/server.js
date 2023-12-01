const fs = require('fs');
const express = require('express');
const https = require('https');
const options = {
  key: fs.readFileSync('/etc/ssl/localhost+2-key.pem'),
  cert: fs.readFileSync('/etc/ssl/localhost+2.pem')
};
const socketIo = require('socket.io');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const server = https.createServer(options, app);
const io = require("socket.io")(server, {
  cors: {
    origin: "https://10.13.134.57", 
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');

  //generate unique connection id
  const clientId = socket.id;
  
  let ffmpegCommand;
  let videoCount = 0; // Initialize video count for this client

  socket.on('stream', (data) => {
    // Check if data is base64 (old method)
    if (data.startsWith('data:image')) {
      if (!ffmpegCommand) {
        // Initialize ffmpeg command if it doesn't exist
        ffmpegCommand = ffmpeg()
          .input('pipe:0')
          .inputFormat('image2pipe')
          .videoCodec('libx264')
          .size('640x480')
          .outputOptions([
            '-pix_fmt yuv420p',
            '-preset ultrafast',
            '-f segment',
            '-segment_time 30',
            '-reset_timestamps 1',
            '-r 30'
          ])
          .output(`tempVids/output-${clientId}-%03d.mp4`)
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
      }

      const frame = data.split(';base64,').pop();
      const imageBuffer = Buffer.from(frame, 'base64');
      if (ffmpegCommand.ffmpegProc && !ffmpegCommand.ffmpegProc.stdin.destroyed) {
        ffmpegCommand.ffmpegProc.stdin.write(imageBuffer);
      } else {
        console.error('ffmpegProc does not exist or stdin is destroyed');
      }
    } else {
      // Assume data is a video file (new method)
      const videoFilename = `output-${clientId}-${String(videoCount).padStart(3, '0')}.mp4`;
      fs.writeFile(`tempVids/${videoFilename}`, data, 'binary', (err) => {
        if (err) {
          console.error('Error writing video file:', err);
        } else {
          console.log('Video file saved');
          videoCount++;
        }
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
    if (ffmpegCommand && ffmpegCommand.ffmpegProc) {
      ffmpegCommand.ffmpegProc.stdin.end();
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

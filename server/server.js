const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('a user connected');
  
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
    .output('tempVids/output-%03d.mp4')
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
      //ffmpegCommand.kill('SIGINT');
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
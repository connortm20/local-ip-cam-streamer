const fs =require('fs');
const path = require('path');
const express = require('express');
const https = require('https');
const options = { key: fs.readFileSync('/etc/ssl/localhost+2-key.pem'),
		  cert: fs.readFileSync('/etc/ssl/localhost+2.pem')};
//const options = { key: fs.readFileSync('server.key'),
//		  cert: fs.readFileSync('server.crt')};

//manual request for new access
//https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=85065df1-1a3c-466e-a0f9-0ef87e3badda&scope=files.readwrite&response_type=token&redirect_uri=https://localhost:5000/oauth-callback
const yourAccessToken = "EwB4A8l6BAAUAOyDv0l6PcCVu89kmzvqZmkWABkAATC%2bYsWQoHwpPhH2A9sEta1L7jLn4V2QJvPgzPRLDUig8n/I%2bkYKE1RmCaV7Zza5BeWZ%2b3G1MdNfzGTg%2b9D4ZLmYsoz9mfrlUg1EVNpU1eOYQBIbwBMMsncm/L7BxB14scOZLdp1Jo9PtVY72zpE43gaOtBQJXITdweAVCq0BUfY3s/BKpUfTnq7TN9Dwipi894TpVzowF2Klkxjr4W%2bwhyPPko3KcfJ1uV7I5BRVZo/te1T/PRbYcglT5vv%2buOOnaJOFCQnpjEHwpGzOfv2bECRfuk1ZfdIMTBDHJvxfbMIALFA7qQH4r6X86T4lApjOjgvFlmfJTAdjWb74kE5fzcDZgAACC7wc33SWnzXSAJQevtgvxtLzXZ95X8l5y1Yp72UiN2zlxN8JNgHjg6Bq2hVJ10rwiL2RGkUdcT5YdZ%2b%2biwB8db5l0vzFl4XkoUKrOCwnEv7YM6GytKAy0eAjRq%2bqRX3FWAMP9ywEll%2bLjwP0ibCItNLvy4rVRDqtUSeogHMitnG%2b10iNpszg2oo/211ewDmn/pwUWjl0F3tX7kn6XN4Br2o3WtWghhQwnsL9dDfYM5oVJpXcsxv4hLxXc2V4StxWA/5VRaMzA6PWEtK4c1UBPR96iwiEbRh5FDNOzR%2bIXSeQpOUW6hExaRrIIFcZMOGQVtToETW4qD6F5m5CfS5B5r2y3sBE4a4GD8bU9qADD8XDJW2KQN/ujSwaOCHf%2bxQm94l4wIFB9u/2zyy%2bMpoL26fgpHEwpltwUShrHZ46Lj%2bo4qH3KlelGOvPPLd1m0LyFfvD58OzoKp7o8REidMY4%2be/S3wQAc97r%2bT6oDnMrgGwmENtr/F0A2xtEvSH%2bAOgeybx5SVkCp32hqwGu2%2bwm0Xr6OHVVkbP8wU2cSbtAlDCbCaufd1PI2DwMiM7nlErHLAMv6fEI%2bfKXW29KwrcmcSKrZ0eyYmqSubZPWB0Ji5US6TOlhS0PMrP8efPKqbwvox5H4%2bEuETvLUXW5we2/kzjQt9zNh5RjyAnu%2b8APCM1cmnwcO391EsPvirX6GlX9JmgBLwMyIjGRK25o9o3/wOvNQJHiC/JxCYX20z/xZJ%2bpvFJB8WfExghD%2bodgoi5RMl6ROLqEHPWvr8pnqczxfGtXUC"
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

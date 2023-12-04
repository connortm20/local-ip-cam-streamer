const fs =require('fs');
const path = require('path');
const express = require('express');
const https = require('https');
const options = { key: fs.readFileSync('/etc/ssl/localhost+2-key.pem'),
		  cert: fs.readFileSync('/etc/ssl/localhost+2.pem')};
//const options = { key: fs.readFileSync('server.key'),
//		  cert: fs.readFileSync('server.crt')};

const socketIo = require('socket.io');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const server = https.createServer(options, app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  }
});

const uploadToOneDrive = require('./uploadToOneDrive');

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
    .on('end', () => {
    const directory = 'tempVids';
    
    fs.readdir(directory, (err, files) => {
        if (err) {
            console.error('Unable to read the directory:', err);
            return;
        }
        
        // Filter out the files to include only the ones that match your filename pattern
        const segments = files
            .filter(file => file.startsWith('output-') && file.endsWith(`-${clientId}.mp4`))
            .map(file => ({ file, ctime: fs.statSync(path.join(directory, file)).ctime }))
            .sort((a, b) => b.ctime - a.ctime); // Sort by creation time, newest first

        if (segments.length > 0) {
            const filename = segments[0].file;
		 // Call upload function
            uploadToOneDrive(filename, 'EwBwA8l6BAAUAOyDv0l6PcCVu89kmzvqZmkWABkAAQ589uZU1s4zpe2BPGY/uvvBIxeHQ0BQKblvokiNooHsTizbXk98vnCnYZ2O5FWzY24NTeuna7HZTDyYBqPbm5iop%2bhdWb3D93Xk6bbnzpXUlKWO0dzitiSJloHHuljyf1JGmFaXh5YhDCJY2Vsk086BJ%2buaQV25k6ceyUSEoJ95tZSyUOxVlMZAblmV2TLZAjw9zyd9EPSIBbeT52DwNztPBrYZdiC8v1kP/sSHOvpKmSSRn3bQHXBbgLwP8DdznIeGC1eB0f0tr9GEVbzrxsEEWDXk6c72gWw6anf%2bvFVoZrXE8f2K6t1WsMA0jpDJ77K5iK0jVzmGD7pyOnPIEGADZgAACFTVvFHUPzHwQAJDMwLh/mpgtpucKE4km1QL3z2S8r/575RWSHtVNXFzNSoy8RIkHmw1slMEHSq3tlg/iJwD9FHATvfZsoC3Coc1Cxl6u5Aek7uIEy09ifdhR2yIaA5aCLNutldMuHkVhD8uz0hklJVm1d07Y3eG0rF27v9bq56WiBnW9wcJMHlBQlBNhuZxlogNKSfSB8V9JzWXnNMzuzWpO7qTmwEFvO9uwHfpYow50dK7ufft89sBJttM4WbQnnafFdUUuDODnwMHWA0ElkucS5W4/W2DGY4qoLtgaBBCmbTETmBELn2jiK9U9tfrkNN/lOCKOAAsA/W3RIHFYCGnMeqJ2usqPZz0E%2bw/tW8Am8ocvh%2bPzOf9LBcBCC%2bT%2bp0FBKKLwhvbNAVVizGpZP/l8A/YWHLLYnYuqt93PudY1zGzl1hbDZAO7tWKH8wFWqJuvH8ch7eOBjrq/bgp4uFBEIGkOBoSsuEiKKEFqGKdNCnkUs0gbOoRejRjVO4LDW0RMRBuu64iZPb7xzVblKgcuKNo39T01Cya3x1yFkDPYRKheSAzag0cUQRwLB/RHnFz9ZMA1HyaWxQadjfpgTRQxFVIzJ3mRNyashOlGiswTagYJ8Jme%2b5bAKGJ6b9/FAyUVMvo0LqOg90ssHous7bnl/mPpeqDBRcmXkWESQigV2qr77vf7NtUzzhakMnbPShiaSaaMs6q4ssFTcZpbbShJvdKvQX2lcii690PMGaeaKLTh7580lcPRPhzHANrESxwQ94cIsNbbqZ1Ag%3d%3d')
            .then(() => console.log(`File ${filename} has been processed.`))
            .catch((error) => console.error(`Error processing file ${filename}:`, error));
        }
        else {
            console.error('No video segments found');
        }
    })
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

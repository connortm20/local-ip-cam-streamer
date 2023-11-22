import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const WebcamStreamCapture = () => {
  const videoRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let video;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          }
        });

        //checking what framerate camera is emitting
        const videoTrack = stream.getVideoTracks()[0];
        const trackSettings = videoTrack.getSettings();
        const frameRate = trackSettings.frameRate;
        const frameInterval = 1000 / frameRate;
        
        videoRef.current.srcObject = stream;

        socketRef.current = io('https://192.168.1.126:5000',{ autoConnect: false });
        socketRef.current.open();

        video = videoRef.current;
        video.addEventListener('loadedmetadata', () => {
          video.play();
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          setInterval(() => {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            socketRef.current.emit('stream', canvas.toDataURL('image/webp'));
          }, frameInterval);
        });
      } catch (err) {
        console.error("Error accessing webcam", err);
      }
    })();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      const mediaStream = video?.srcObject;
      const tracks = mediaStream?.getTracks() || [];
      tracks.forEach(track => track.stop());
    
    };
  }, []);

  return <video ref={videoRef} autoPlay playsInline />;
};

export default WebcamStreamCapture;

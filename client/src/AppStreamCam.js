import React, { useEffect, useRef } from 'react';
import io from 'socket.io-client';

const WebcamStreamCapture = () => {
  const videoRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;

        socketRef.current = io('http://localhost:5000');
        
        const video = videoRef.current;
        video.addEventListener('loadedmetadata', () => {
          video.play();
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d');
          setInterval(() => {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            socketRef.current.emit('stream', canvas.toDataURL('image/webp'));
          }, 100); // Emit every 100ms
        });
      } catch (err) {
        console.error("Error accessing webcam", err);
      }
    })();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      const mediaStream = videoRef.current?.srcObject;
      const tracks = mediaStream?.getTracks() || [];
      tracks.forEach(track => track.stop());
    };
  }, []);

  return <video ref={videoRef} autoPlay playsInline />;
};

export default WebcamStreamCapture;
import React, { useEffect, useRef } from 'react';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';
import io from 'socket.io-client';

const LocalEncodeStreamCam = () => {
  const cameraRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let isRecording = false;
    let videoUri = '';
    const videoLength = 10000;

    const startRecording = async () => {
      if (cameraRef.current) {
        isRecording = true;
        const video = await cameraRef.current.recordAsync();
        videoUri = video.uri;
      }
    };

    const stopRecording = async () => {
      if (cameraRef.current && isRecording) {
        cameraRef.current.stopRecording();
        isRecording = false;
      }
    };

    const sendVideoToServer = async () => {
      if (socketRef.current && videoUri) {
        const videoBase64 = await FileSystem.readAsStringAsync(videoUri, { encoding: FileSystem.EncodingType.Base64 });
        socketRef.current.emit('stream', videoBase64);
      }
    };

    const recordVideoSegments = async () => {
      await startRecording();

      setInterval(async () => {
        await stopRecording();
        await sendVideoToServer();
        await startRecording();
      }, videoLength);
    };

    socketRef.current = io('https://10.13.134.57:5000', { autoConnect: false });
    socketRef.current.open();

    recordVideoSegments();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return <Camera ref={cameraRef} style={{ flex: 1 }} />;
};

export default LocalEncodeStreamCam;

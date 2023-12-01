import React, { useEffect } from 'react';

import WebcamStreamCapture from './AppStreamCam';
//import LocalEncodeStreamCam from './LocalEncodeStreamCam';

import './App.css';


function App() {
  
  //disable scrolling on entire app component
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
  
    window.addEventListener('touchmove', preventDefault, { passive: false });
    window.addEventListener('MozMousePixelScroll', preventDefault, false);
  
    return () => {
      window.removeEventListener('touchmove', preventDefault);
      window.removeEventListener('MozMousePixelScroll', preventDefault);
    };
  }, []);

  return (
    <div className="page-container">
      <div className="cameraFeed">
       {<WebcamStreamCapture/>}
       {/*<LocalEncodeStreamCam/>*/}
            </div>
    </div>
  );
}


export default App;

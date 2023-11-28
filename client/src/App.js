import React, { useEffect } from 'react';

import WebcamStreamCapture from './AppStreamCam';

import './App.css';


function App() {
  
  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
  
    // Add both touchmove and MozMousePixelScroll event listeners
    window.addEventListener('touchmove', preventDefault, { passive: false });
    window.addEventListener('MozMousePixelScroll', preventDefault, false);
  
    // Cleanup event listeners when the component is unmounted
    return () => {
      window.removeEventListener('touchmove', preventDefault);
      window.removeEventListener('MozMousePixelScroll', preventDefault);
    };
  }, []);

  return (
    <div className="page-container">
      <div className="cameraFeed">
       {<WebcamStreamCapture/>}
            </div>
    </div>
  );
}


export default App;

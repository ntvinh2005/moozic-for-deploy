import React, { useRef, useEffect } from 'react';
import './MoodCapture.css';

function MoodCapture() {
  const videoRef = useRef(null);

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing the camera:", err);
      }
    }
    setupCamera();
  }, []);

  const handleCapture = () => {
    console.log("Mood captured!");
  };

  return (
    <div className="mood-capture">
      <h2>Capture Your Mood</h2>
      <p>We'll analyze your facial expression to create a custom playlist that matches your mood!</p>
      <video ref={videoRef} autoPlay />
      <button onClick={handleCapture}>Capture Mood</button>
    </div>
  );
}

export default MoodCapture;
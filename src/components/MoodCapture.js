import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import './MoodCapture.css';

const MoodCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      setInitialized(true);
    };

    loadModels();
  }, []);

  useEffect(() => {
    if (initialized) {
      const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
          .then(stream => {
            videoRef.current.srcObject = stream;
          })
          .catch(err => console.error('Error accessing webcam: ', err));
      };

      startVideo();

      videoRef.current.addEventListener('play', () => {
        const displaySize = { width: videoRef.current.width, height: videoRef.current.height };
        faceapi.matchDimensions(canvasRef.current, displaySize);

        const intervalId = setInterval(async () => {
          if (videoRef.current.readyState === 4) { // Ensure the video is ready
            const videoFeedEl = videoRef.current;
            const canvas = canvasRef.current;

            // Make the canvas the same size and in the same location as the video feed
            canvas.style.left = `${videoFeedEl.offsetLeft}px`;
            canvas.style.top = `${videoFeedEl.offsetTop}px`;
            canvas.width = videoFeedEl.width;
            canvas.height = videoFeedEl.height;

            // Facial detection with points
            let faceAIData = await faceapi.detectAllFaces(videoFeedEl)
              .withFaceLandmarks()
              .withAgeAndGender()
              .withFaceExpressions();

            // Clear the canvas
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);

            // Resize face detection results
            faceAIData = faceapi.resizeResults(faceAIData, videoFeedEl);

            // Draw the results
            faceapi.draw.drawDetections(canvas, faceAIData);
            faceapi.draw.drawFaceLandmarks(canvas, faceAIData);
            faceapi.draw.drawFaceExpressions(canvas, faceAIData);

            // Draw age and gender
            faceAIData.forEach(face => {
              const { age, gender, genderProbability, detection } = face;
              const genderText = `${gender} - ${(genderProbability * 100).toFixed(2)}%`;
              const ageText = `${Math.round(age)} years`;
              const textField = new faceapi.draw.DrawTextField(
                [genderText, ageText],
                detection.box.topRight
              );
              textField.draw(canvas);

              const drawBox = new faceapi.draw.DrawBox(detection.box, { label: genderText });
              drawBox.draw(canvas);
            });
          }
        }, 200);

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
      });
    }
  }, [initialized]);

  return (
    <div class = "mood-capture" style={{position: 'relative', width: '720px', height: '560px' }}>
      <h2>Capture Your Mood</h2>
      <p>We'll analyze your facial expression to create a custom playlist that matches your mood!</p>
      <video ref={videoRef} autoPlay muted width="720" height="560" />
      <canvas ref={canvasRef} style={{ position: 'absolute' }} />
      <button>Capture Mood</button>
    </div>
  );
};

export default MoodCapture;
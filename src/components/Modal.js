import React from 'react';
import './Modal.css';

const Modal = ({ show, onClose }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="modal">
      <div className="modal-content">
      <h2>Instructions</h2>
        <p>
          Before using the app, please make sure you are in a well-lit environment and your face is clearly visible to the camera.
        </p>
        <p>
            Our AI model might need a minute to start so please be patient. Thank you!
        </p>
        <p>
          Also make sure the background color contrasts with your skin tone for better detection.
        </p>
        <p>
          Wait for the blue box to constantly capture the face before clicking on the Capture Mood button.
        </p>
        <p>
            Enjoy using our service!
        </p>
        <button onClick={onClose}>Got it!</button>
      </div>
    </div>
  );
};

export default Modal;
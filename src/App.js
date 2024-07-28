import React from 'react';
import './App.css';
import Header from './components/Header';
import MoodCapture from './components/MoodCapture';
import Background from './components/Background';
import { FaceDataProvider } from './contexts/faceDataContext';

function App() {
  return (
    <div className="App">
      <FaceDataProvider>
      <Background />
      <div className="content">
      <Header />
      <main>
        <MoodCapture />
      </main>
    </div>
    </FaceDataProvider>
    </div>
  );
}

export default App;
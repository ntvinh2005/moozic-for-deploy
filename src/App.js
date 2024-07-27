import React from 'react';
import './App.css';
import Header from './components/Header';
import MoodCapture from './components/MoodCapture';
import Background from './components/Background';

function App() {
  return (
    <div className="App">
      <Background />
      <div className="content">
      <Header />
      <main>
        <MoodCapture />
      </main>
    </div>
    </div>
  );
}

export default App;
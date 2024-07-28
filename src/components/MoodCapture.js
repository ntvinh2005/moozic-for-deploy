import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import './MoodCapture.css';
import Modal from './Modal';

const SPOTIFY_CLIENT_ID = 'bea5b71ce3af47098343af7338805a06';  
const REDIRECT_URI = 'http://localhost:3000/';      //Need to change when deploy
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'playlist-modify-public',
    'playlist-modify-private',
];
const AUTH_URL = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES.join(' '))}&response_type=token`;

const MoodCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [initialized, setInitialized] = useState(false);
  const [faceData, setFaceData] = useState([]);
  const [playlist, setPlaylist] = useState(null);

  const [showModal, setShowModal] = useState(true);

  const handleCloseModal = () => {
    setShowModal(false);
  };


  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models';
      console.log('Loading models...');
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      console.log('Models loaded successfully');
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
          if (videoRef.current.readyState === 4) {
            const videoFeedEl = videoRef.current;
            const canvas = canvasRef.current;

            canvas.style.left = `${videoFeedEl.offsetLeft}px`;
            canvas.style.top = `${videoFeedEl.offsetTop}px`;
            canvas.width = videoFeedEl.width;
            canvas.height = videoFeedEl.height;

            let faceAIData = await faceapi.detectAllFaces(videoFeedEl)
              .withFaceLandmarks()
              .withAgeAndGender()
              .withFaceExpressions();

            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);

            faceAIData = faceapi.resizeResults(faceAIData, videoFeedEl);

            faceapi.draw.drawDetections(canvas, faceAIData);
            faceapi.draw.drawFaceLandmarks(canvas, faceAIData);
            faceapi.draw.drawFaceExpressions(canvas, faceAIData);

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

            if (faceAIData.length > 0) {
              setFaceData(faceAIData);
            }
          }
        }, 200);

        return () => clearInterval(intervalId);
      });
    }
  }, [initialized]);

  useEffect(() => {
    if (faceData.length > 0) {
      console.log(faceData);
    }
  }, [faceData]);

  const fetchTracksBasedOnMood = async (mood, energy, valence, tempo) => {
    const url = `https://api.spotify.com/v1/recommendations?seed_genres=${mood}&min_energy=${energy.min}&max_energy=${energy.max}&min_valence=${valence.min}&max_valence=${valence.max}&target_tempo=${tempo}`;
    const data = await fetchWithSpotifyAPI(url);
    return data.tracks;
};

const fetchTracksBasedOnAge = async (age) => {
    let url;
    if (age <= 12) {
        url = `https://api.spotify.com/v1/playlists/37i9dQZF1DWXbMxJaAyCq5/tracks`;
    } else if (age <= 19) {
        url = `https://api.spotify.com/v1/playlists/37i9dQZF1DX1BzILRveYHb/tracks`;
    } else if (age <= 29) {
        url = `https://api.spotify.com/v1/playlists/37i9dQZF1DXcBWIGoYBM5M/tracks`;
    } else if (age <= 49) {
        url = `https://api.spotify.com/v1/playlists/37i9dQZF1DX4sWSpwq3LiO/tracks`;
    } else {
        url = `https://api.spotify.com/v1/playlists/37i9dQZF1DXa6YOhGMjjgx/tracks`;
    }

    const data = await fetchWithSpotifyAPI(url);
    return data.items.map(item => item.track);
};

const createSpotifyPlaylist = async (tracks) => {
    const accessToken = localStorage.getItem('accessToken');
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    const userData = await userResponse.json();
    const userId = userData.id;

    const createPlaylistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: 'Generated Playlist',
            description: 'A playlist generated based on your mood and age.',
            public: false,
        }),
    });

    const playlistData = await createPlaylistResponse.json();
    const playlistId = playlistData.id;

    await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            uris: tracks.map(track => track.uri),
        }),
    });

    return playlistData;
};

const fetchWithSpotifyAPI = async (url) => {
    const accessToken = localStorage.getItem('accessToken');
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    const data = await response.json();
    return data;
};

const getMoodParameters = (mood) => {
    switch (mood) {
        case 'happy':
            return {
                energy: { min: 0.7, max: 1.0 },
                valence: { min: 0.7, max: 1.0 },
                tempo: 120,
            };
        case 'sad':
            return {
                energy: { min: 0.1, max: 0.4 },
                valence: { min: 0.1, max: 0.4 },
                tempo: 60,
            };
        case 'angry':
            return {
                energy: { min: 0.7, max: 1.0 },
                valence: { min: 0.1, max: 0.4 },
                tempo: 140,
            };
        case 'calm':
            return {
                energy: { min: 0.3, max: 0.6 },
                valence: { min: 0.5, max: 0.8 },
                tempo: 80,
            };
        default:
            return {
                energy: { min: 0.4, max: 0.7 },
                valence: { min: 0.4, max: 0.7 },
                tempo: 100,
            };
    }
};




const handleAuthentication = () => {
  const hash = window.location.hash;
  if (hash) {
      const params = new URLSearchParams(hash.replace('#', ''));
      const accessToken = params.get('access_token');
      if (accessToken) {
          localStorage.setItem('accessToken', accessToken);
      }
  } else {
      window.location.href = AUTH_URL;
  }
};

useEffect(() => {
  handleAuthentication();
}, []);

const generatePlaylist = async () => {
  if (faceData != []) {
      const mood = faceData[0].expressions;
      const age = faceData[0].age;

      const moodType = Object.keys(mood).reduce((a, b) => mood[a] > mood[b] ? a : b);
      console.log('Detected mood:', moodType);
      console.log('Detected age:', age);

      const { energy, valence, tempo } = getMoodParameters(moodType);

      const moodBasedTracks = await fetchTracksBasedOnMood(moodType, energy, valence, tempo);
      console.log('Mood based tracks:', moodBasedTracks);

      const ageBasedTracks = await fetchTracksBasedOnAge(age);
      console.log('Age based tracks:', ageBasedTracks);

      const combinedTracks = [...moodBasedTracks, ...ageBasedTracks];
      const shuffledTracks = combinedTracks.sort(() => Math.random() - 0.5);
      console.log('Shuffled tracks:', shuffledTracks);

      const playlist = await createSpotifyPlaylist(shuffledTracks);
      setPlaylist(playlist);
      console.log('Playlist created:', playlist);
  } else {
      console.log('No face data detected');
  }
};

  return (
    <div className = "mood-capture" style={{position: 'relative', width: '720px', height: '560px' }}>
      <Modal show={showModal} onClose={handleCloseModal} />
      <h2>Capture Your Mood</h2>
      <p>We'll analyze your facial expression to create a custom playlist that matches your mood!</p>
      <video ref={videoRef} autoPlay muted width="720" height="560" />
      <canvas ref={canvasRef} style={{ position: 'absolute' }} />
      <button onClick = {generatePlaylist}>Capture Mood</button>
      {playlist ? (
                <div className = "playlist-link">
                    <h3>Playlist Created!</h3>
                    <a href={playlist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                        Open Playlist on Spotify
                    </a>
                </div>
            ) : (<div className = "playlist-link"><h3>Playlist will be shown here!</h3></div>)}
    </div>
  );
};

export default MoodCapture;
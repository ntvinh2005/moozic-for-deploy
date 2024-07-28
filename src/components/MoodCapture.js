import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import './MoodCapture.css';

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
            
            setFaceData(faceAIData);

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
          }
        }, 200);

        return () => clearInterval(intervalId); 
      });
    }
  }, [initialized]);


const fetchTracksBasedOnMood = async (mood) => {
  const url = `https://api.spotify.com/v1/recommendations?seed_genres=${mood}`;
  const data = await fetchWithSpotifyAPI(url);
  return data.tracks;
};

const fetchTracksBasedOnAge = async (age) => {
  let url;
  if (age <= 12) {
      // Children's music playlist
      url = `https://api.spotify.com/v1/playlists/37i9dQZF1DWXbMxJaAyCq5/tracks`; // Example playlist ID
  } else if (age <= 19) {
      // Teen pop hits
      url = `https://api.spotify.com/v1/playlists/37i9dQZF1DX1BzILRveYHb/tracks`; // Example playlist ID
  } else if (age <= 29) {
      // Young adult hits
      url = `https://api.spotify.com/v1/playlists/37i9dQZF1DXcBWIGoYBM5M/tracks`; // Example playlist ID
  } else if (age <= 49) {
      // Adult contemporary
      url = `https://api.spotify.com/v1/playlists/37i9dQZF1DX4sWSpwq3LiO/tracks`; // Example playlist ID
  } else {
      // Oldies
      url = `https://api.spotify.com/v1/playlists/37i9dQZF1DXa6YOhGMjjgx/tracks`; // Example playlist ID
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
  if (faceData && faceData.length > 0) {
      const mood = faceData[0].expressions;
      const age = faceData[0].age;

      const moodType = Object.keys(mood).reduce((a, b) => mood[a] > mood[b] ? a : b);
      const moodBasedTracks = await fetchTracksBasedOnMood(moodType);
      const ageBasedTracks = await fetchTracksBasedOnAge(age);

      const combinedTracks = [...moodBasedTracks, ...ageBasedTracks];

      const playlist = await createSpotifyPlaylist(combinedTracks);
      setPlaylist(playlist);
      console.log(playlist)
      console.log("generated")
  }
};

  return (
    <div class = "mood-capture" style={{position: 'relative', width: '720px', height: '560px' }}>
      <h2>Capture Your Mood</h2>
      <p>We'll analyze your facial expression to create a custom playlist that matches your mood!</p>
      <video ref={videoRef} autoPlay muted width="720" height="560" />
      <canvas ref={canvasRef} style={{ position: 'absolute' }} />
      <button onClick = {generatePlaylist}>Capture Mood</button>
      {playlist && (
                <div>
                    <h3>Playlist Created!</h3>
                    <a href={playlist.external_urls.spotify} target="_blank" rel="noopener noreferrer">
                        Open Playlist on Spotify
                    </a>
                </div>
            )}
    </div>
  );
};

export default MoodCapture;
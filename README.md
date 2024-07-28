# MOOZIC

## Overview

Moozic is a React-based web application that creates personalized Spotify playlists based on the user's current mood. The app uses facial expression analysis to detect the user's mood and then generates a playlist of songs that match that mood using Spotify's API and audio features.

## Features

- Facial mood detection using the device camera
- Integration with Spotify API for playlist generation
- Customized playlist creation based on detected mood
- Responsive design for various screen sizes
- Beautiful UI with a dynamic background

## Technologies Used

- React.js
- Spotify Web API
- Local face detection model 
- CSS for styling

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js and npm installed
- A Spotify Developer account and API credentials
- A compatible web browser with camera access

## Installation and Setup

1. Clone the repository:
     git clone https://github.com/your-username/mood-music-playlist-generator.git
     cd moozic
2. Install the dependencies
3. Create a `.env` file in the root directory and add your Spotify API credentials:
     REACT_APP_SPOTIFY_CLIENT_ID=your_client_id_here
     REACT_APP_SPOTIFY_CLIENT_SECRET=your_client_secret_here
     REACT_APP_SPOTIFY_REDIRECT_URI=http://localhost:3000/callback
4. Start the development server:
5. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Grant camera access when prompted by the browser.
2. Look at the camera and click the "Capture Mood" button.
3. The app will analyze your facial expression and detect your mood.
4. Click "Generate Playlist" to create a Spotify playlist based on your mood.
5. Enjoy your personalized mood-based playlist!

## Contributing

Contributions to Moozic are welcome. Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## Acknowledgements

- Spotify Web API
- Face detection model used: https://github.com/justadudewhohacks/face-api.js/
- React.js community

## Contact

If you have any questions or feedback, please contact Vinh at ntvinhgv@gmail.com or Gabriel at gabrielkson15@gmail.com

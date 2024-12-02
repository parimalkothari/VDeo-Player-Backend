# VDeo-Player-Backend

The **VDeo-Player-Backend** is a RESTful API built with Node.js and Express.js to power a video streaming and social platform. The backend supports user authentication, video uploads, playlist management, subscriptions, likes, comments, tweets, and more.

## Features

### User Management

- **Authentication**: Register, login, logout, and token refresh.
- **Account Management**: Update user details, avatar, and cover images.
- **Watch History**: Add, remove, and clear watch history.
- **User Profile**: View channel profiles by username.

### Video Management

- **Upload & Management**: Add, update, and delete videos.
- **Publishing**: Toggle publish status.
- **Search**: Fetch all videos or retrieve a specific video.

### Playlist Management

- Create, update, and delete playlists.
- Add or remove videos in playlists.
- Fetch user-specific or playlist-specific details.

### Comment Management

- Add, update, and delete comments on videos.
- Retrieve comments for specific videos.

### Like Management

- Like or unlike videos, comments, and tweets.
- Fetch user’s liked videos, comments, or tweets.

### Subscription Management

- Subscribe to or unsubscribe from channels.
- Retrieve subscribed channels or channel subscribers.

### Tweet Management

- Post, update, and delete tweets.
- Retrieve tweets by user.

### Dashboard

- Fetch channel stats and uploaded videos.

### Healthcheck

- Ensure the backend is running and healthy.
  - `GET /healthcheck/`: Returns the health status of the backend.

---

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/VDeo-Player-Backend.git
   cd VDeo-Player-Backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up a `.env` file with the required environment variables:

- `PORT`=8000
- `MONGODB_URI`=mongodb+srv://yourMongoDbUser\:yourMongoDbPassword\@cluster.mongodb.net
- `CORS_ORIGIN`=\*
- `ACCESS_TOKEN_SECRET`=your-access-token-secret
- `ACCESS_TOKEN_EXPIRY`=1d
- `REFRESH_TOKEN_SECRET`=your-refresh-token-secret
- `REFRESH_TOKEN_EXPIRY`=10d
- `CLOUDINARY_CLOUD_NAME`=your-cloudinary-cloud-name
- `CLOUDINARY_API_KEY`=your-cloudinary-api-key
- `CLOUDINARY_API_SECRET`=your-cloudinary-api-secret


4. Start the development server:
   ```bash
   npm run dev
   ```

#### Notes:
- Replace `yourMongoDbUser`, `yourMongoDbPassword`, and other placeholder values with your actual credentials.
- Keep your `.env` file secure and never expose it to public repositories. Make sure to add it to `.gitignore` to prevent accidental commits.


---

## API Endpoints

### User Routes

- `POST /users/register`: Register a new user with avatar and cover image upload.
- `POST /users/login`: Login a user.
- `POST /users/logout`: Logout the user.
- `POST /users/refresh-token`: Refresh access token.
- `PATCH /users/change-password`: Update user password.
- `GET /users/current-user`: Get current logged-in user details.
- `PATCH /users/update-account`: Update account details.
- `PATCH /users/change-avatar`: Update avatar image.
- `PATCH /users/change-coverImage`: Update cover image.
- `GET /users/c/:username`: Get user channel profile.
- `GET /users/watch-history`: Get user’s watch history.
- `DELETE /users/watch-history`: Clear watch history.
- `POST /users/watch-history/:videoId`: Add a video to watch history.
- `DELETE /users/watch-history/:videoId`: Remove a video from watch history.

### Video Routes

- `POST /videos/add-video`: Upload a new video with thumbnail.
- `GET /videos/v/:videoId`: Get video details by ID.
- `PATCH /videos/v/:videoId`: Update video details.
- `DELETE /videos/v/:videoId`: Delete a video.
- `PATCH /videos/t/:videoId`: Toggle publish status.
- `GET /videos/search`: Retrieve all videos.

### Playlist Routes

- `POST /playlists/`: Create a playlist.
- `GET /playlists/user/:userId`: Get playlists for a specific user.
- `GET /playlists/:playlistId`: Get a playlist by ID.
- `PATCH /playlists/:playlistId`: Update a playlist.
- `DELETE /playlists/:playlistId`: Delete a playlist.
- `POST /playlists/add/:videoId/:playlistId`: Add a video to a playlist.
- `DELETE /playlists/remove/:videoId/:playlistId`: Remove a video from a playlist.

### Comment Routes

- `POST /comments/:videoId`: Add a comment to a video.
- `GET /comments/:videoId`: Fetch all comments for a video.
- `PATCH /comments/c/:commentId`: Update a comment.
- `DELETE /comments/c/:commentId`: Delete a comment.

### Like Routes

- `POST /likes/video/:videoId`: Like or unlike a video.
- `POST /likes/comment/:commentId`: Like or unlike a comment.
- `POST /likes/tweet/:tweetId`: Like or unlike a tweet.
- `GET /likes/getLikedVideos`: Fetch liked videos.
- `GET /likes/getLikedComments`: Fetch liked comments.
- `GET /likes/getLikedTweets`: Fetch liked tweets.

### Subscription Routes

- `POST /subscriptions/:channelId`: Subscribe or unsubscribe to a channel.
- `GET /subscriptions/subscribers/:channelId`: Get subscribers of a channel.
- `GET /subscriptions/channels/:subscriberId`: Get channels a user is subscribed to.

### Tweet Routes

- `POST /tweets/`: Post a new tweet.
- `PATCH /tweets/t/:tweetId`: Update a tweet.
- `DELETE /tweets/t/:tweetId`: Delete a tweet.
- `GET /tweets/u/:userId`: Fetch all tweets by a user.

### Dashboard Routes

- `GET /dashboard/c/:channelId`: Get channel-specific videos.
- `GET /dashboard/stats`: Get channel stats.

### Healthcheck

- `GET /healthcheck/`: Check server health.

---

## Technologies

- **Backend Framework**: Node.js, Express.js
- **Database**: MongoDB
- **Authentication**: JWT for secure session management
- **File Uploads**: Multer for handling media uploads

---

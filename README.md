# Formula Evergreen Championship 🏎️

A Formula 1-style sim racing leaderboard web application built with Node.js, Express, and PostgreSQL.

## Features

- **F1-Themed UI**: Modern, responsive design inspired by Formula 1 aesthetics
- **Google OAuth Authentication**: Secure sign-in with role-based access control
- **Driver Management**: Add, edit, and delete drivers with profile pictures
- **Race Management**: Set next race location, date/time with automatic timezone handling
- **File Uploads**: Profile pictures and circuit images with validation
- **Timezone Support**: PST input with local timezone display and auto-expiration
- **Admin Controls**: Restricted access for authorized users only

## Prerequisites

- Node.js (v14 or higher)
- Docker & Docker Compose
- Google Cloud Console account (for OAuth)

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd sim-leader
npm install
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your actual values
nano .env
```

**Required Environment Variables:**

- `GOOGLE_CLIENT_ID`: Your Google OAuth 2.0 Client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth 2.0 Client Secret  
- `SESSION_SECRET`: A secure random string for session encryption
- `AUTHORIZED_EMAILS`: Comma-separated list of admin email addresses

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
5. Copy the Client ID and Client Secret to your `.env` file

### 4. Start the Full Stack with Docker

```bash
# Build and start the entire application stack
docker compose up --build

# Or run in detached mode
docker compose up --build -d
```

This will start both the PostgreSQL database and the Node.js application. The app will be available at `http://localhost:3001`.

### Alternative: Database Only Setup

If you prefer to run the Node.js app locally:

```bash
# Start only the database
docker compose up db -d

# Then run the app locally
npm start
```

### 5. Generate Session Secret

```bash
# Generate a secure session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `SESSION_SECRET` in your `.env` file.

## Usage

### Admin Features (Authorized Users)
- Add new drivers with profile pictures
- Edit existing driver information
- Delete drivers from the leaderboard
- Set next race location and date/time
- Upload circuit images

### General Features (All Users)
- View the leaderboard
- See driver profile pictures
- View next race information
- Sign in with Google

## File Structure

```
sim-leader/
├── src/
│   ├── index.js          # Main server file
│   └── models/           # Database models
├── public/
│   ├── index.html        # Main UI
│   ├── styles.css        # F1-themed styling
│   ├── script.js         # Frontend logic
│   └── uploads/          # User-uploaded files
├── docker-compose.yml    # PostgreSQL setup
├── .env.example          # Environment template
└── README.md            # This file
```

## Technologies Used

- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: PostgreSQL
- **Authentication**: Passport.js with Google OAuth 2.0
- **File Uploads**: Multer
- **Frontend**: Vanilla JavaScript, CSS3
- **Styling**: F1-inspired responsive design
- **Infrastructure**: Docker for database

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and personal use.

## Support

If you encounter any issues, please check:
1. All environment variables are set correctly
2. Docker containers are running
3. Google OAuth credentials are valid
4. Authorized emails are configured properly

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

**Optional Environment Variables (for production):**

- `DOMAIN`: Your domain name (e.g., yourdomain.com)
- `CADDY_EMAIL`: Email for Let's Encrypt certificates
- `DIGITALOCEAN_API_TOKEN`: DigitalOcean API token for DNS challenge

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
5. Copy the Client ID and Client Secret to your `.env` file

### 4. Configure Load Balancer Mode

The application includes a Caddy load balancer with three different configuration files. Choose the appropriate Caddyfile for your deployment mode by editing the docker-compose.yml file.

#### Available Modes

##### 1. HTTP Mode (Development/Testing)

**Caddyfile**: `Caddyfile.http`

```yaml
# In docker-compose.yml, use:
- ./Caddyfile.http:/etc/caddy/Caddyfile:ro
```

- Serves on `http://localhost`
- No SSL/TLS encryption
- Perfect for local development and testing
- No additional configuration required

##### 2. HTTPS Local Mode (Development with SSL)

**Caddyfile**: `Caddyfile.https-local`

```yaml
# In docker-compose.yml, use:
- ./Caddyfile.https-local:/etc/caddy/Caddyfile:ro
```

- Serves on `https://localhost`
- Uses self-signed certificates (browser warning expected)
- Good for testing HTTPS features locally
- No additional configuration required

##### 3. HTTPS Production Mode (Let's Encrypt)

**Caddyfile**: `Caddyfile.https-production`

```yaml
# In docker-compose.yml, use:
- ./Caddyfile.https-production:/etc/caddy/Caddyfile:ro
```

- Serves on your actual domain with Let's Encrypt certificates
- Automatic SSL/TLS with trusted certificates
- Requires domain, email, and DigitalOcean API token in .env file
- Production-ready with HSTS and security headers

#### How to Switch Modes

1. **Edit docker-compose.yml**: Uncomment the desired Caddyfile line in the caddy service volumes section
2. **For production mode**: Ensure DOMAIN, CADDY_EMAIL, and DIGITALOCEAN_API_TOKEN are set in your .env file
3. **Restart services**: Run `docker compose down && docker compose up --build -d`

#### Example: Switching to HTTPS Production

```yaml
# In docker-compose.yml caddy service:
volumes:
  # Comment out other modes:
  # - ./Caddyfile.http:/etc/caddy/Caddyfile:ro
  # - ./Caddyfile.https-local:/etc/caddy/Caddyfile:ro  
  # Uncomment production mode:
  - ./Caddyfile.https-production:/etc/caddy/Caddyfile:ro
```

Then restart: `docker compose down && docker compose up --build -d`

### 5. Start the Application Stack

**Development (Local):**

```bash
# Start only the database
docker compose up db -d

# Run the app locally for debugging
npm start
```

**Production (Full Stack with Caddy):**

1. **Configure Caddy mode**: Edit docker-compose.yml to use the desired Caddyfile
2. **For production mode**: Ensure DOMAIN, CADDY_EMAIL, and DIGITALOCEAN_API_TOKEN are set in .env
3. **Build and start**:

```bash
# Build and start the full stack
docker compose up --build

# Or run in detached mode
docker compose up --build -d
```

**Access Points:**

The application is served through a Caddy load balancer for better performance and SSL handling:

- **Development Direct**: `http://localhost:3001` (bypasses load balancer)
- **HTTP Mode**: `http://localhost` (via Caddy load balancer)
- **HTTPS Local**: `https://localhost` (via Caddy, self-signed cert - browser warning expected)
- **HTTPS Production**: `https://yourdomain.com` (via Caddy, Let's Encrypt trusted certificate)

**OAuth Configuration Note:** When using the load balancer, update your Google OAuth redirect URIs to match your chosen mode (e.g., `http://localhost/auth/google/callback` for HTTP mode or `https://yourdomain.com/auth/google/callback` for production).

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

### 6. DigitalOcean DNS Setup (Optional - for production HTTPS)

For automatic HTTPS with DigitalOcean DNS challenge:

1. **Get API Token**:
   - Go to [DigitalOcean API](https://cloud.digitalocean.com/account/api/tokens)
   - Generate a new token with write access
   - Copy to `DIGITALOCEAN_API_TOKEN` in your `.env` file

2. **Configure Domain**:
   - Set your domain in `DOMAIN=yourdomain.com`
   - Set your email in `CADDY_EMAIL=your@email.com`
   - Point your domain's DNS to your server's IP

3. **DNS Records** (in DigitalOcean):
   ```
   A    yourdomain.com        -> your_server_ip
   A    www.yourdomain.com    -> your_server_ip
   ```

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
│   └── uploads/          # User-uploaded files (local dev only)
├── docker-compose.yml    # Multi-service orchestration
├── Caddyfile            # Load balancer configuration
├── Caddyfile.http           # HTTP mode configuration
├── Caddyfile.https-local    # HTTPS local mode configuration  
├── Caddyfile.https-production # HTTPS production mode configuration
├── .env.example         # Environment template
└── README.md           # This file
```

## Docker Architecture

### Volume Management

The application uses Docker named volumes for persistent data storage:

- **`uploads_shared`**: Shared volume between app and Caddy services for user-uploaded files
  - App container: `/usr/src/app/public/uploads` (read/write)
  - Caddy container: `/var/www/html/uploads` (read-only)
  - Ensures file synchronization and eliminates conflicts
- **`db_data`**: PostgreSQL database files
- **`caddy_data`**: Caddy certificates and configuration data
- **`caddy_config`**: Caddy runtime configuration
- **`caddy_logs`**: Caddy access and error logs

### Service Communication

- **App** ↔ **Database**: Internal Docker network communication
- **Caddy** → **App**: Load balancer proxies requests to app service
- **External** → **Caddy**: Public HTTP/HTTPS endpoints

## Technologies Used

- **Backend**: Node.js, Express.js, Sequelize ORM
- **Database**: PostgreSQL
- **Load Balancer**: Caddy with automatic HTTPS
- **Authentication**: Passport.js with Google OAuth 2.0
- **File Uploads**: Multer
- **Frontend**: Vanilla JavaScript, CSS3
- **Styling**: F1-inspired responsive design
- **Infrastructure**: Docker for database and reverse proxy
- **SSL/TLS**: Let's Encrypt via DigitalOcean DNS challenge

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and personal use.

## Troubleshooting

### Load Balancer Issues

**Cannot access the application:**

- Verify your chosen mode matches your access URL
- Check that Caddy container is running: `docker compose ps`
- For HTTPS modes, ensure CADDY_EMAIL is set in your .env file

**OAuth login fails:**

- Update Google OAuth redirect URIs to match your load balancer URL
- For HTTP mode: `http://localhost/auth/google/callback`
- For HTTPS production: `https://yourdomain.com/auth/google/callback`

**SSL certificate issues (HTTPS modes):**

- HTTPS Local: Browser warnings are expected with self-signed certificates
- HTTPS Production: Ensure domain points to your server and DigitalOcean DNS is configured
- Check Caddy logs: `docker compose logs caddy`

### Environment Configuration

**Caddy configuration issues:**

- Ensure the correct Caddyfile is mounted in docker-compose.yml
- For production mode, verify DOMAIN, CADDY_EMAIL, and DIGITALOCEAN_API_TOKEN are set in .env
- Check that only one Caddyfile volume mount is uncommented
- Restart services after changing Caddyfile: `docker compose down && docker compose up --build -d`

**Missing CADDY_EMAIL error:**

- Ensure CADDY_EMAIL is set in your .env file for production mode
- Only required when using Caddyfile.https-production

**Database connection issues:**

- Ensure PostgreSQL container is running: `docker compose ps`
- Check database logs: `docker compose logs db`
- Verify DATABASE_URL in .env matches docker-compose service name

### General Issues

**Migrating from local uploads directory:**

If you have existing files in `./public/uploads/`, you'll need to copy them to the new shared volume:

```bash
# Start the services to create the volume
docker compose up -d

# Copy existing uploads to the shared volume
docker cp ./public/uploads/. $(docker compose ps -q app):/usr/src/app/public/uploads/

# Restart services to ensure proper mounting
docker compose restart
```

**Application won't start:**

- Check all containers are running: `docker compose ps`
- View logs for specific services: `docker compose logs [service-name]`
- Ensure all required environment variables are set

**Profile picture uploads fail:**

- Check uploads directory permissions in the shared volume
- Verify the `uploads_shared` volume is properly mounted
- Ensure app container has write access to the shared upload volume
- Check app logs for upload-related errors: `docker compose logs app`

## Support

If you encounter any issues, please check:

1. All environment variables are set correctly
2. Docker containers are running
3. Google OAuth credentials are valid
4. Authorized emails are configured properly
5. Load balancer mode matches your access method

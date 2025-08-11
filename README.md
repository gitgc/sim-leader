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

The application includes a Caddy load balancer with two different configuration files. Choose the appropriate Caddyfile for your deployment mode by editing the docker-compose.yml file.

#### Available Modes

##### 1. HTTP Mode (Development/Testing)

**Caddyfile**: `config/Caddyfile.http`

```yaml
# In docker-compose.yml, use:
- ./config/Caddyfile.http:/etc/caddy/Caddyfile:ro
```

- Serves on `http://localhost`
- No SSL/TLS encryption
- Perfect for local development and testing
- No additional configuration required

##### 2. HTTPS Production Mode (Let's Encrypt)

**Caddyfile**: `config/Caddyfile.https-production`

```yaml
# In docker-compose.yml, use:
- ./config/Caddyfile.https-production:/etc/caddy/Caddyfile:ro
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
  # Comment out HTTP mode:
  # - ./config/Caddyfile.http:/etc/caddy/Caddyfile:ro
  # Uncomment production mode:
  - ./config/Caddyfile.https-production:/etc/caddy/Caddyfile:ro
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
├── config/
│   ├── Caddyfile.http           # HTTP mode configuration
│   └── Caddyfile.https-production # HTTPS production mode configuration
├── docker-compose.yml    # Multi-service orchestration
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

## Testing

The application includes a comprehensive test suite with unit tests, integration tests, and end-to-end tests.

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch
```

### Test Coverage

- **Unit Tests**: Models, authentication, utilities, database operations
- **Integration Tests**: API endpoints with mocked dependencies
- **End-to-End Tests**: Complete workflow scenarios
- **Coverage**: 81.25% overall coverage

### Test Technologies

- **Jest**: Testing framework and test runner
- **Supertest**: HTTP testing for API endpoints
- **SQLite**: In-memory database for isolated testing
- **Mocking**: External dependencies (Passport, database connections)

For detailed testing information, see [Testing Guide](docs/TESTING.md).

## CI/CD

The project includes comprehensive GitHub Actions workflows for automated testing, code quality checks, and deployment.

### Automated Workflows

**Tests Workflow** (on Pull Requests and Push to Main):

- ✅ **Multi-version testing**: Node.js 18.x, 20.x, 22.x
- ✅ **Code quality**: Biome linting and formatting checks
- ✅ **Security audits**: npm audit for dependency vulnerabilities
- ✅ **Test coverage**: Automated test execution with coverage reporting
- ✅ **Dependency validation**: Check for outdated packages

**Deploy Workflow** (triggered after successful tests on Main):

- ✅ **Docker image build**: Multi-architecture (AMD64, ARM64) Docker images
- ✅ **Container registry**: Published to GitHub Container Registry (ghcr.io)
- ✅ **Semantic versioning**: Automatic version increments starting from v0.0.1
- ✅ **Version management**: Automatically updates package.json and commits changes
- ✅ **GitHub releases**: Automated release creation with Docker commands
- ✅ **Image caching**: Optimized builds with GitHub Actions cache

### Docker Images

After each merge to main, Docker images are automatically built and published with semantic versioning:

```bash
# Pull the latest image
docker pull ghcr.io/gitgc/sim-leader:latest

# Pull a specific version
docker pull ghcr.io/gitgc/sim-leader:v0.0.1

# Run the containerized application (latest)
docker run -p 3001:3001 --env-file .env ghcr.io/gitgc/sim-leader:latest

# Run a specific version
docker run -p 3001:3001 --env-file .env ghcr.io/gitgc/sim-leader:v0.0.1
```

### Code Quality Commands

```bash
# Linting and formatting
npm run lint        # Check code with Biome linter
npm run lint:fix    # Fix auto-fixable linting issues
npm run format      # Check code formatting
npm run format:fix  # Auto-format code
npm run check       # Run both linting and formatting checks
npm run check:fix   # Fix both linting and formatting issues
```

**Code Style Configuration:**

- **Semicolons**: Only added when required (ASI-safe)
- **Quotes**: Single quotes for strings
- **Indentation**: 2 spaces
- **Line Width**: 100 characters

The GitHub Actions workflows automatically run these checks on every PR and deploy successful changes to the main branch.

### Workflow Files

- **`.github/workflows/test.yml`**: Runs tests, linting, and security checks on every PR and push
- **`.github/workflows/deploy.yml`**: Updates package.json version, builds and publishes Docker images after successful tests on main branch

### Version Management

The deployment process automatically:

1. Determines the next semantic version (patch increment)
2. Updates `package.json` with the new version
3. Commits the version change to the repository
4. Builds Docker images with the new version tag
5. Creates a GitHub release

This ensures that the package.json version always stays in sync with the deployed Docker images and GitHub releases.

## Deployment

### Using Pre-built Docker Images

The easiest way to deploy the application is using the pre-built Docker images from GitHub Container Registry. Images are automatically versioned with semantic versioning (starting from v0.0.1):

```bash
# Pull the latest image
docker pull ghcr.io/gitgc/sim-leader:latest

# Or pull a specific version for production stability
docker pull ghcr.io/gitgc/sim-leader:v0.0.1

# Create your environment file
cp .env.example .env
# Edit .env with your configuration

# Run with Docker (standalone) - latest
docker run -p 3001:3001 --env-file .env ghcr.io/gitgc/sim-leader:latest

# Run with Docker (standalone) - specific version
docker run -p 3001:3001 --env-file .env ghcr.io/gitgc/sim-leader:v0.0.1

# Or run with docker-compose (recommended)
# Edit docker-compose.yml to use the pre-built image:
# image: ghcr.io/gitgc/sim-leader:v0.0.1  # Use specific version for production
# image: ghcr.io/gitgc/sim-leader:latest   # Or use latest for development
# Comment out the 'build: .' line
docker compose up -d
```

### Production Deployment Options

1. **Cloud Platforms**: Deploy directly to AWS, Google Cloud, Azure, or DigitalOcean
2. **Container Orchestration**: Use with Kubernetes, Docker Swarm, or Nomad
3. **PaaS Providers**: Deploy to Heroku, Railway, Render, or similar platforms
4. **Self-hosted**: Run on your own servers with Docker Compose

### Deployment Checklist

- [ ] Configure environment variables in `.env`
- [ ] Set up Google OAuth credentials
- [ ] Configure authorized emails
- [ ] Set up PostgreSQL database
- [ ] Configure domain and SSL (for production)
- [ ] Test the deployment

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

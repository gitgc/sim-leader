# Google OAuth Setup Guide

To enable Google Sign-In authentication for your Sim Racing Leaderboard, you need to set up a Google OAuth application. Follow these steps:

## 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make sure the project is selected in the top navigation

## 2. Enable Google+ API

1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API" 
3. Click on it and press "Enable"

## 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have a Google Workspace)
3. Fill in the required information:
   - App name: "Sim Racing Leaderboard"
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes: `email`, `profile`, `openid`
5. Add test users (the email addresses you want to authorize)

## 4. Create OAuth Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Name it "Sim Racing Leaderboard"
5. Add authorized redirect URIs:
   - `http://localhost:3001/auth/google/callback`
   - Add your production domain when deploying (e.g., `https://yourdomain.com/auth/google/callback`)

## 5. Update Environment Variables

1. Copy the Client ID and Client Secret from the credentials page
2. Update your `.env` file:

```env
# Replace with your actual Google OAuth credentials
GOOGLE_CLIENT_ID=your_actual_google_client_id_here
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret_here
SESSION_SECRET=generate_a_random_secret_string_here

# Add authorized email addresses (comma separated)
AUTHORIZED_EMAILS=your-email@gmail.com,admin@yourdomain.com,manager@yourdomain.com
```

## 6. Generate a Session Secret

Generate a random string for SESSION_SECRET. You can use:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 7. Update Authorized Emails

In the `AUTHORIZED_EMAILS` environment variable, add the email addresses of users who should have admin access (can add/edit/delete drivers). Other users will have read-only access.

## 8. Restart Your Server

After updating the `.env` file, restart your development server:

```bash
npm run dev
```

## 9. Test Authentication

1. Open http://localhost:3001 in your browser
2. Click "SIGN IN WITH GOOGLE"
3. Authorize the application
4. You should be redirected back with your profile information

## Important Notes

- **Development**: The app is currently configured for `localhost:3001`
- **Production**: Update redirect URIs in Google Console when deploying
- **Security**: Never commit your `.env` file with real credentials to version control
- **Authorization**: Only emails listed in `AUTHORIZED_EMAILS` can manage drivers

## Troubleshooting

1. **"redirect_uri_mismatch"**: Make sure the redirect URI in Google Console matches exactly
2. **"invalid_client"**: Check that your Client ID and Secret are correct
3. **"access_denied"**: Make sure your email is added as a test user in the OAuth consent screen

## Email Authorization

- Users not in the `AUTHORIZED_EMAILS` list can still sign in but will only have read-only access
- They will see a notice that they're viewing in read-only mode
- Admin users will see "ADMIN ACCESS" in their user status

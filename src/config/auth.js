const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Configure Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Extract user info from Google profile
    const user = {
      id: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      photo: profile.photos[0].value
    };
    
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize user for session storage
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from session
passport.deserializeUser((user, done) => {
  done(null, user);
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
};

// Middleware to check if user is authorized (has admin access)
const isAuthorized = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  const authorizedEmails = process.env.AUTHORIZED_EMAILS ? 
    process.env.AUTHORIZED_EMAILS.split(',').map(email => email.trim()) : [];
  
  if (!authorizedEmails.includes(req.user.email)) {
    return res.status(403).json({ error: 'Access denied. You are not authorized to perform this action.' });
  }
  
  next();
};

module.exports = {
  passport,
  isAuthenticated,
  isAuthorized
};

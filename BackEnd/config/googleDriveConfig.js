
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Load client credentials
const credentials = JSON.parse(fs.readFileSync(path.join(__dirname, '../credentials.json')));
const CLIENT_ID = credentials.web.client_id;
const CLIENT_SECRET = credentials.web.client_secret;
const REDIRECT_URI = credentials.web.redirect_uris[0];

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
);

// Replace with your actual refresh token
const REFRESH_TOKEN = 'YOUR_REFRESH_TOKEN';
oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

// Export the authenticated Google Drive instance
const drive = google.drive({
    version: 'v3',
    auth: oauth2Client,
});

module.exports = drive;

# Google Drive Backup Setup

## Backend Setup

1. Install googleapis package:
```bash
cd backend
npm install googleapis
```

2. Create Google Cloud Project and enable Google Drive API:
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing one
   - Enable Google Drive API
   - Create OAuth 2.0 credentials (Web application)
   - Add authorized redirect URI: http://localhost:5000/api/backup/oauth2callback
   - Copy your Client ID and Client Secret

3. Configure credentials in backend/.env:
```env
# Google Drive API Credentials
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/backup/oauth2callback
```

4. Restart backend server for changes to take effect

## Frontend Setup

1. Add FontAwesome icons in your main.js or where icons are registered:
```javascript
import { faCloudUploadAlt, faLink, faSpinner, faSave, faDownload } from '@fortawesome/free-solid-svg-icons'
library.add(faCloudUploadAlt, faLink, faSpinner, faSave, faDownload)
```

## Features

### Manual Backup
- Export products, variants, add-ons, transactions, sales, customers, and users
- Upload to Google Drive automatically
- Per-store backup

### Scheduled Backup
- Daily, weekly, or monthly automatic backups
- Configurable time settings
- Same data export as manual backup

### Backup History
- View recent backups
- Download from Google Drive
- Track backup status

## Usage

1. Go to Settings > Google Drive Backup tab
2. Click "Connect Google Drive"
3. Authorize the application in the popup window
4. Configure what to backup (select checkboxes)
5. Perform manual backup or set up schedule
6. View backup history and download when needed

## Troubleshooting

- If "Not Connected" appears, check your .env credentials
- If authorization fails, verify redirect URI matches in Google Cloud Console
- Token is saved in backend/config/google-token.json automatically after first authorization
- For production, update GOOGLE_REDIRECT_URI to your domain

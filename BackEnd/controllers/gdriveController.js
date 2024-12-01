const { google } = require('googleapis');
const { GoogleAuth } = require('google-auth-library');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const path = require('path');

// Path to Google API credentials
const CREDENTIALS_PATH = path.join(__dirname, '../google-api.json');
const sampleData = [
    { "name": "John Doe", "age": 30, "email": "john.doe@example.com", "city": "New York" },
    { "name": "Jane Smith", "age": 25, "email": "jane.smith@example.com", "city": "Los Angeles" },
    { "name": "Samuel Green", "age": 35, "email": "samuel.green@example.com", "city": "Chicago" },
    { "name": "Emily White", "age": 28, "email": "emily.white@example.com", "city": "San Francisco" },
    { "name": "David Brown", "age": 40, "email": "david.brown@example.com", "city": "Austin" },
    { "name": "Sarah Black", "age": 32, "email": "sarah.black@example.com", "city": "Seattle" }
  ]
// Function to upload a file to Google Drive
async function uploadToDrive(filePath, fileName, folderId) {
  const auth = new GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const drive = google.drive({ version: 'v3', auth });

  const fileMetadata = {
    name: fileName,
    parents: [folderId], // Specify the target folder ID here
  };

  const media = {
    mimeType: 'text/csv',
    body: fs.createReadStream(filePath),
  };

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media,
    fields: 'id',
  });

  return response.data.id;
}

// Reusable function to export data and upload file
exports.exportData = async (req, res) => {
  try {
    // Get folder ID and other parameters from request body
    const { fileName, folderId } = req.body;

    // Validate the input
    if (!fileName || !sampleData || !folderId) {
      return res.status(400).json({ error: 'File name, sample data, and folder ID are required.' });
    }

    // Define the path for the CSV file
    const filePath = path.join(__dirname, '../records', fileName);

    // Configure CSV writer
    const csvWriter = createCsvWriter({
      path: filePath,
      header: Object.keys(sampleData[0]).map((key) => ({ id: key, title: key })),
    });

    // Write data to CSV file
    await csvWriter.writeRecords(sampleData);

    // Upload CSV file to Google Drive
    const fileId = await uploadToDrive(filePath, fileName, folderId);

    // Respond with the file ID and file path
    res.status(201).json({
      message: 'File uploaded successfully to Google Drive',
      fileId: fileId,
      filePath: filePath,  // Returning the file path
    });

    // Clean up - delete the file after uploading if needed

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred during the file upload process.' });
  }
};

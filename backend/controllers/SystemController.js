const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs').promises;
const path = require('path');

// GitHub repository configuration
const GITHUB_REPO = 'Inton1701/POSExpress'; // Update with your actual repo

/**
 * Get current system version
 */
const getCurrentVersion = async (req, res) => {
    try {
        const versionPath = path.join(__dirname, '../../VERSION');
        const version = await fs.readFile(versionPath, 'utf8');
        
        res.json({
            success: true,
            version: version.trim(),
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error reading version:', error);
        res.json({
            success: true,
            version: '1.0.0',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Check for updates from GitHub
 */
const checkForUpdates = async (req, res) => {
    try {
        // Get current version
        const versionPath = path.join(__dirname, '../../VERSION');
        let currentVersion = '1.0.0';
        try {
            currentVersion = (await fs.readFile(versionPath, 'utf8')).trim();
        } catch (err) {
            console.error('Could not read VERSION file:', err);
        }

        // Fetch latest release from GitHub
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        
        if (!response.ok) {
            return res.json({
                success: false,
                message: 'Could not fetch release information from GitHub',
                currentVersion,
                updateAvailable: false
            });
        }

        const releaseData = await response.json();
        const latestVersion = releaseData.tag_name.replace('v', '');
        
        // Compare versions
        const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;

        res.json({
            success: true,
            currentVersion,
            latestVersion,
            updateAvailable,
            release: {
                tag_name: releaseData.tag_name,
                name: releaseData.name,
                body: releaseData.body,
                html_url: releaseData.html_url,
                published_at: releaseData.published_at,
                assets: releaseData.assets?.map(asset => ({
                    name: asset.name,
                    size: asset.size,
                    download_url: asset.browser_download_url
                }))
            }
        });

    } catch (error) {
        console.error('Error checking for updates:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check for updates',
            error: error.message
        });
    }
};

/**
 * Trigger system update
 */
const triggerUpdate = async (req, res) => {
    try {
        const scriptPath = path.join(__dirname, '../../auto-update.sh');
        
        // Check if update script exists
        try {
            await fs.access(scriptPath);
        } catch (err) {
            return res.status(404).json({
                success: false,
                message: 'Update script not found. Please update manually.'
            });
        }

        // Execute update script in background
        // Note: This will update and restart the system
        res.json({
            success: true,
            message: 'Update process started. The system will restart automatically.',
            note: 'You may need to refresh the page in a few moments.'
        });

        // Execute after response is sent
        setTimeout(async () => {
            try {
                // Make script executable
                await execPromise(`chmod +x "${scriptPath}"`);
                
                // Run update script (this will restart the system)
                exec(`bash "${scriptPath}" << EOF\ny\n3\nEOF`, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Update execution error:', error);
                        return;
                    }
                    console.log('Update output:', stdout);
                    if (stderr) console.error('Update stderr:', stderr);
                });
            } catch (err) {
                console.error('Error triggering update:', err);
            }
        }, 1000);

    } catch (error) {
        console.error('Error triggering update:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger update',
            error: error.message
        });
    }
};

/**
 * Compare semantic versions
 */
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const part1 = parts1[i] || 0;
        const part2 = parts2[i] || 0;
        
        if (part1 > part2) return 1;
        if (part1 < part2) return -1;
    }
    
    return 0;
}

module.exports = {
    getCurrentVersion,
    checkForUpdates,
    triggerUpdate
};

const { exec, spawn } = require('child_process');
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
        console.log(`Checking for updates from GitHub: ${GITHUB_REPO}`);
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`);
        
        console.log(`GitHub response status: ${response.status}`);
        
        if (!response.ok) {
            // Check if it's a 404 (no releases published)
            if (response.status === 404) {
                console.log('No releases found on GitHub (404)');
                return res.json({
                    success: true,
                    message: 'System is up to date',
                    currentVersion,
                    latestVersion: currentVersion,
                    updateAvailable: false
                });
            }
            
            console.log(`GitHub API error: ${response.status}`);
            return res.json({
                success: true,
                message: 'System is up to date',
                currentVersion,
                latestVersion: currentVersion,
                updateAvailable: false
            });
        }

        const releaseData = await response.json();
        
        // Check if we got valid release data
        if (!releaseData.tag_name) {
            console.log('Invalid release data - no tag_name');
            return res.json({
                success: false,
                message: 'Invalid release data from GitHub',
                currentVersion,
                updateAvailable: false
            });
        }
        
        const latestVersion = releaseData.tag_name.replace('v', '');
        console.log(`Current version: ${currentVersion}, Latest version: ${latestVersion}`);
        
        // Compare versions
        const updateAvailable = compareVersions(latestVersion, currentVersion) > 0;
        console.log(`Update available: ${updateAvailable}`);

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
 * Trigger automated system update (no prompts)
 */
const triggerUpdate = async (req, res) => {
    try {
        const scriptPath = path.join(__dirname, '../../update-system.sh');
        const logPath = '/var/log/posexpress-update.log';
        
        // Check if update script exists
        try {
            await fs.access(scriptPath);
        } catch (err) {
            return res.status(404).json({
                success: false,
                message: 'Update script not found. Please update manually.'
            });
        }

        // Determine the current user and environment
        const currentUser = process.env.USER || process.env.USERNAME || 'unknown';
        const isRoot = currentUser === 'root' || process.getuid?.() === 0;
        
        console.log(`[Update] Current user: ${currentUser}, isRoot: ${isRoot}`);
        console.log(`[Update] Script path: ${scriptPath}`);

        // Make script executable first
        try {
            await execPromise(`chmod +x "${scriptPath}"`);
        } catch (chmodErr) {
            console.log('[Update] chmod skipped (may be Windows):', chmodErr.message);
        }

        // Create/clear the log file first to ensure it exists and is writable
        try {
            // Try to create log file - this tests if we have write permission
            if (isRoot) {
                await execPromise(`touch "${logPath}" && chmod 666 "${logPath}"`);
            } else {
                // Try with sudo
                await execPromise(`sudo touch "${logPath}" && sudo chmod 666 "${logPath}"`);
            }
        } catch (logErr) {
            console.log('[Update] Could not create log file:', logErr.message);
            // Continue anyway, script might handle it
        }

        // Write initial log entry
        try {
            const initialLog = `========================================\n[${new Date().toISOString()}] Update triggered from UI\nUser: ${currentUser}\nScript: ${scriptPath}\n========================================\n`;
            await fs.writeFile(logPath, initialLog, { flag: 'w' }).catch(() => {});
        } catch (e) {
            console.log('[Update] Could not write initial log');
        }

        // Send response immediately so UI knows update started
        res.json({
            success: true,
            message: 'Automated update started. System will update and restart automatically.',
            note: 'The application will restart in a few moments. Please wait...',
            logPath: logPath
        });

        // Execute update script after response is sent
        // Using spawn with detached: true for proper process detachment
        setTimeout(() => {
            try {
                console.log('[Update] Starting update process...');
                
                // Prepare the command based on whether we need sudo
                let updateProcess;
                
                if (isRoot) {
                    // Running as root, execute directly
                    console.log('[Update] Executing as root');
                    updateProcess = spawn('/bin/bash', [scriptPath], {
                        detached: true,
                        stdio: ['ignore', 'pipe', 'pipe'],
                        cwd: path.dirname(scriptPath)
                    });
                } else {
                    // Need sudo - try multiple methods
                    console.log('[Update] Executing with sudo');
                    
                    // Method 1: Try passwordless sudo with spawn
                    updateProcess = spawn('sudo', ['-n', '/bin/bash', scriptPath], {
                        detached: true,
                        stdio: ['ignore', 'pipe', 'pipe'],
                        cwd: path.dirname(scriptPath)
                    });
                }

                // Log stdout to file and console
                if (updateProcess.stdout) {
                    updateProcess.stdout.on('data', (data) => {
                        const output = data.toString();
                        console.log('[Update stdout]', output);
                        // Append to log file
                        fs.appendFile(logPath, output).catch(() => {});
                    });
                }

                // Log stderr to file and console
                if (updateProcess.stderr) {
                    updateProcess.stderr.on('data', (data) => {
                        const output = data.toString();
                        console.error('[Update stderr]', output);
                        // Append to log file
                        fs.appendFile(logPath, `[ERROR] ${output}`).catch(() => {});
                    });
                }

                // Handle process errors
                updateProcess.on('error', async (err) => {
                    const errorMsg = `[${new Date().toISOString()}] Failed to start update process: ${err.message}\n`;
                    console.error('[Update]', errorMsg);
                    await fs.appendFile(logPath, errorMsg).catch(() => {});
                    
                    // If passwordless sudo failed, try alternative method with exec
                    if (err.message.includes('ENOENT') || err.message.includes('spawn')) {
                        console.log('[Update] Trying alternative execution method...');
                        
                        // Fallback: use exec with shell
                        const fallbackCmd = isRoot 
                            ? `/bin/bash "${scriptPath}" >> "${logPath}" 2>&1`
                            : `sudo /bin/bash "${scriptPath}" >> "${logPath}" 2>&1`;
                        
                        exec(fallbackCmd, { 
                            cwd: path.dirname(scriptPath),
                            timeout: 600000 // 10 minute timeout
                        }, (execErr, stdout, stderr) => {
                            if (execErr) {
                                console.error('[Update fallback] Execution failed:', execErr);
                                fs.appendFile(logPath, `\n[FALLBACK ERROR] ${execErr.message}\n`).catch(() => {});
                            }
                        });
                    }
                });

                // Handle process exit
                updateProcess.on('exit', (code, signal) => {
                    const exitMsg = `[${new Date().toISOString()}] Update process exited with code ${code}, signal ${signal}\n`;
                    console.log('[Update]', exitMsg);
                    fs.appendFile(logPath, exitMsg).catch(() => {});
                });

                // Unref the process so it can continue after Node exits
                updateProcess.unref();
                
                console.log('[Update] Update process spawned with PID:', updateProcess.pid);
                fs.appendFile(logPath, `[${new Date().toISOString()}] Update process started with PID: ${updateProcess.pid}\n`).catch(() => {});

            } catch (spawnErr) {
                console.error('[Update] Spawn error:', spawnErr);
                fs.appendFile(logPath, `[SPAWN ERROR] ${spawnErr.message}\n`).catch(() => {});
                
                // Last resort: use shell exec
                console.log('[Update] Using shell exec as last resort...');
                const shellCmd = `cd "${path.dirname(scriptPath)}" && sudo /bin/bash "${scriptPath}" >> "${logPath}" 2>&1 &`;
                exec(shellCmd, (err) => {
                    if (err) {
                        console.error('[Update shell exec] Failed:', err);
                        fs.appendFile(logPath, `[SHELL EXEC ERROR] ${err.message}\n`).catch(() => {});
                    }
                });
            }
        }, 500);

    } catch (error) {
        console.error('[Update] Error triggering update:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to trigger update',
            error: error.message
        });
    }
};

/**
 * List available backup versions for revert
 */
const listBackups = async (req, res) => {
    try {
        const os = require('os');
        const homeDir = os.homedir();
        const backupDir = path.join(homeDir, 'posexpress-backups');
        
        // Check if backup directory exists
        try {
            await fs.access(backupDir);
        } catch (err) {
            return res.json({
                success: true,
                backups: [],
                message: 'No backups found'
            });
        }
        
        // Read backup directory
        const files = await fs.readdir(backupDir);
        
        // Filter and parse backups
        const backups = [];
        for (const file of files) {
            const backupPath = path.join(backupDir, file);
            const stats = await fs.stat(backupPath);
            
            if (stats.isDirectory()) {
                // Try to read metadata
                let metadata = null;
                try {
                    const metadataPath = path.join(backupPath, 'metadata.json');
                    const metadataContent = await fs.readFile(metadataPath, 'utf8');
                    metadata = JSON.parse(metadataContent);
                } catch (err) {
                    // No metadata, extract from folder name
                    const match = file.match(/v?([\d.]+)-(\d{8}-\d{6})/);
                    if (match) {
                        metadata = {
                            version: match[1],
                            timestamp: match[2],
                            date: stats.mtime.toISOString()
                        };
                    }
                }
                
                if (metadata) {
                    backups.push({
                        path: file,
                        fullPath: backupPath,
                        version: metadata.version,
                        date: metadata.date,
                        timestamp: metadata.timestamp,
                        size: await getDirectorySize(backupPath)
                    });
                }
            }
        }
        
        // Sort by date (newest first)
        backups.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        res.json({
            success: true,
            backups,
            backupDir
        });
        
    } catch (error) {
        console.error('Error listing backups:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to list backups',
            error: error.message
        });
    }
};

/**
 * Revert to a previous backup version
 */
const revertUpdate = async (req, res) => {
    try {
        const { backupPath } = req.body;
        
        if (!backupPath) {
            return res.status(400).json({
                success: false,
                message: 'Backup path is required'
            });
        }
        
        const scriptPath = path.join(__dirname, '../../revert-update.sh');
        
        // Check if revert script exists
        try {
            await fs.access(scriptPath);
        } catch (err) {
            return res.status(404).json({
                success: false,
                message: 'Revert script not found. Please revert manually.'
            });
        }
        
        // Execute revert script in background
        res.json({
            success: true,
            message: 'Revert started. System will restore and restart automatically.',
            note: 'The application will restart in a few moments. Please wait...'
        });
        
        // Execute after response is sent
        setTimeout(async () => {
            try {
                // Make script executable
                try {
                    await execPromise(`chmod +x "${scriptPath}"`);
                } catch (chmodErr) {
                    console.log('chmod skipped:', chmodErr.message);
                }
                
                // Run revert script with sudo
                // Note: User must have passwordless sudo configured (see deploy-frontend.sh)
                console.log(`Starting revert to: ${backupPath}`);
                const revertProcess = exec(`sudo /bin/bash "${scriptPath}" "${backupPath}" 2>&1`, {
                    timeout: 600000, // 10 minute timeout
                    maxBuffer: 1024 * 1024 * 10 // 10MB buffer
                }, (error, stdout, stderr) => {
                    if (error) {
                        console.error('Revert execution error:', error);
                        console.error('Exit code:', error.code);
                        console.error('stderr:', stderr);
                        return;
                    }
                    console.log('Revert output:', stdout);
                    if (stderr) console.log('Revert stderr:', stderr);
                });
                
                revertProcess.stdout?.on('data', (data) => {
                    console.log('Revert:', data.toString());
                });
                
                revertProcess.stderr?.on('data', (data) => {
                    console.error('Revert error:', data.toString());
                });
            } catch (err) {
                console.error('Error triggering revert:', err);
            }
        }, 1000);
        
    } catch (error) {
        console.error('Error reverting update:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revert update',
            error: error.message
        });
    }
};

/**
 * Helper: Get directory size
 */
async function getDirectorySize(dirPath) {
    try {
        const { stdout } = await execPromise(`du -sh "${dirPath}" 2>/dev/null | cut -f1`);
        return stdout.trim() || 'N/A';
    } catch (err) {
        return 'N/A';
    }
}

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

/**
 * Reboot the system
 */
const rebootSystem = async (req, res) => {
    try {
        const os = require('os');
        const platform = os.platform();
        
        console.log(`Attempting system reboot on ${platform}`);
        
        if (platform === 'win32') {
            // Windows reboot command
            exec('shutdown /r /t 5', (error) => {
                if (error) {
                    console.error('Reboot command error:', error);
                }
            });
        } else if (platform === 'linux' || platform === 'darwin') {
            // Linux/macOS reboot command - uses passwordless sudo configured in deploy script
            exec('sudo /usr/sbin/reboot', (error) => {
                if (error) {
                    console.error('Reboot command error:', error);
                }
            });
        }
        
        res.json({
            success: true,
            message: 'System reboot initiated - system will restart in 5 seconds'
        });
    } catch (error) {
        console.error('Reboot error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate system reboot'
        });
    }
};

/**
 * Shutdown the system
 */
const shutdownSystem = async (req, res) => {
    try {
        const os = require('os');
        const platform = os.platform();
        
        console.log(`Attempting system shutdown on ${platform}`);
        
        if (platform === 'win32') {
            // Windows shutdown command
            exec('shutdown /s /t 5', (error) => {
                if (error) {
                    console.error('Shutdown command error:', error);
                }
            });
        } else if (platform === 'linux' || platform === 'darwin') {
            // Linux/macOS shutdown command - uses passwordless sudo configured in deploy script
            exec('sudo /usr/sbin/poweroff', (error) => {
                if (error) {
                    console.error('Shutdown command error:', error);
                }
            });
        }
        
        res.json({
            success: true,
            message: 'System shutdown initiated - system will power off in 5 seconds'
        });
    } catch (error) {
        console.error('Shutdown error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate system shutdown'
        });
    }
};

/**
 * Get update log contents
 */
const getUpdateLog = async (req, res) => {
    try {
        const logPath = '/var/log/posexpress-update.log';
        
        // Check if log exists
        try {
            await fs.access(logPath);
        } catch (err) {
            return res.json({
                success: true,
                log: '',
                message: 'No update log found'
            });
        }
        
        // Read last 1000 lines of log
        try {
            const { stdout } = await execPromise(`tail -1000 "${logPath}"`);
            res.json({
                success: true,
                log: stdout
            });
        } catch (err) {
            res.json({
                success: true,
                log: '',
                message: 'Could not read log file'
            });
        }
    } catch (error) {
        console.error('Error reading update log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to read update log',
            error: error.message
        });
    }
};

/**
 * Check update system prerequisites (diagnostic endpoint)
 */
const checkUpdatePrerequisites = async (req, res) => {
    try {
        const scriptPath = path.join(__dirname, '../../update-system.sh');
        const logPath = '/var/log/posexpress-update.log';
        const currentUser = process.env.USER || process.env.USERNAME || 'unknown';
        const isRoot = currentUser === 'root' || process.getuid?.() === 0;
        
        const checks = {
            user: currentUser,
            isRoot,
            scriptPath,
            logPath,
            scriptExists: false,
            scriptExecutable: false,
            logWritable: false,
            sudoConfigured: false,
            bashPath: null
        };
        
        // Check if script exists
        try {
            await fs.access(scriptPath);
            checks.scriptExists = true;
            
            // Check if executable
            const stats = await fs.stat(scriptPath);
            checks.scriptExecutable = (stats.mode & 0o111) !== 0;
        } catch (e) {
            checks.scriptError = e.message;
        }
        
        // Check if log is writable
        try {
            await fs.access(logPath, fs.constants.W_OK);
            checks.logWritable = true;
        } catch (e) {
            // Try to create it
            try {
                await fs.writeFile(logPath, '', { flag: 'a' });
                checks.logWritable = true;
            } catch (e2) {
                checks.logError = e2.message;
            }
        }
        
        // Check sudo configuration
        if (!isRoot) {
            try {
                const { stdout, stderr } = await execPromise(`sudo -n -l 2>&1`);
                checks.sudoConfigured = stdout.includes('update-system.sh') || stdout.includes('NOPASSWD');
                checks.sudoOutput = stdout.substring(0, 500);
            } catch (e) {
                checks.sudoError = e.message;
                checks.sudoConfigured = false;
            }
        } else {
            checks.sudoConfigured = true; // Running as root
        }
        
        // Find bash path
        try {
            const { stdout } = await execPromise('which bash');
            checks.bashPath = stdout.trim();
        } catch (e) {
            checks.bashPath = '/bin/bash';
        }
        
        // Overall status
        checks.ready = checks.scriptExists && checks.scriptExecutable && (checks.sudoConfigured || isRoot);
        
        res.json({
            success: true,
            checks,
            message: checks.ready 
                ? 'Update system is properly configured' 
                : 'Update system needs configuration. Run: sudo ./setup-update-permissions.sh'
        });
        
    } catch (error) {
        console.error('Error checking prerequisites:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check update prerequisites',
            error: error.message
        });
    }
};

module.exports = {
    getCurrentVersion,
    checkForUpdates,
    triggerUpdate,
    getUpdateLog,
    listBackups,
    revertUpdate,
    rebootSystem,
    shutdownSystem,
    checkUpdatePrerequisites
};

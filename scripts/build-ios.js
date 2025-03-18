/**
 * iOS Build Helper Script
 * 
 * This script automates the process of building and preparing the iOS app
 * for deployment in Xcode.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for nicer output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Log helper function
function log(message, type = 'info') {
  const date = new Date().toLocaleTimeString();
  let prefix = '';
  
  switch(type) {
    case 'info':
      prefix = `${colors.blue}[INFO]${colors.reset}`;
      break;
    case 'success':
      prefix = `${colors.green}[SUCCESS]${colors.reset}`;
      break;
    case 'warn':
      prefix = `${colors.yellow}[WARNING]${colors.reset}`;
      break;
    case 'error':
      prefix = `${colors.red}[ERROR]${colors.reset}`;
      break;
    case 'step':
      prefix = `${colors.cyan}[STEP]${colors.reset}`;
      break;
  }
  
  console.log(`${prefix} ${colors.bright}${date}${colors.reset} ${message}`);
}

// Execute command helper
function execute(command, options = {}) {
  try {
    log(`Executing: ${colors.magenta}${command}${colors.reset}`, 'info');
    
    const result = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    
    return options.silent ? result.toString() : null;
  } catch (error) {
    log(`Command failed: ${command}`, 'error');
    log(error.message, 'error');
    
    if (options.exitOnError !== false) {
      process.exit(1);
    }
    
    return null;
  }
}

// Main function
async function main() {
  try {
    log('Starting iOS build process...', 'step');
    
    // Step 1: Build the web application
    log('Building web application...', 'step');
    execute('npm run build');
    
    // Step 2: Make sure the ios directory exists
    if (!fs.existsSync(path.join(process.cwd(), 'ios'))) {
      log('iOS directory not found. Adding iOS platform...', 'step');
      execute('npx cap add ios');
    } else {
      log('iOS platform already exists.', 'info');
    }
    
    // Step 3: Copy web assets to iOS app
    log('Syncing web assets to iOS app...', 'step');
    execute('npx cap sync ios');
    
    // Step 4: Update capacitor.config.json
    log('Updating Capacitor configuration...', 'step');
    
    // Check if we're on Replit and get the domain
    let replitDomain = process.env.REPLIT_DOMAIN;
    if (replitDomain) {
      log(`Detected Replit environment: ${replitDomain}`, 'info');
      
      // Read the capacitor config
      const configPath = path.join(process.cwd(), 'ios', 'App', 'App', 'capacitor.config.json');
      if (fs.existsSync(configPath)) {
        try {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          
          // Update server URL
          if (!config.server) config.server = {};
          config.server.url = `https://${replitDomain}`;
          config.server.cleartext = true;
          
          // Write back to file
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
          log('Updated capacitor.config.json with Replit URL', 'success');
        } catch (error) {
          log(`Failed to update capacitor.config.json: ${error.message}`, 'error');
        }
      } else {
        log('capacitor.config.json not found, it will be created when running npx cap open ios', 'warn');
      }
    }
    
    // Step 5: Open Xcode
    log('Opening Xcode...', 'step');
    execute('npx cap open ios');
    
    log('iOS build process completed successfully!', 'success');
    log('You can now build and run the app in Xcode.', 'info');
    log(`${colors.yellow}Remember to set up code signing in Xcode to run on a physical device.${colors.reset}`, 'info');
    
  } catch (error) {
    log(`An error occurred: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  log(`Unhandled error: ${error.message}`, 'error');
  process.exit(1);
});
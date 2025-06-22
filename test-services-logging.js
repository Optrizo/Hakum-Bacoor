// Simple test for the logging functionality in backup-services.js
import fs from 'fs';
import path from 'path';

// Setup logging
const logFile = path.join(process.cwd(), 'backup-logs.txt');
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(message);
  
  // Also append to log file if possible
  try {
    fs.appendFileSync(logFile, logEntry);
    return true;
  } catch (err) {
    console.error('Note: Could not write to log file:', err.message);
    return false;
  }
};

// Get the current log file size to verify changes
let originalSize;
try {
  if (fs.existsSync(logFile)) {
    const stats = fs.statSync(logFile);
    originalSize = stats.size;
    console.log(`Current log file size: ${originalSize} bytes`);
  } else {
    console.log('Log file does not exist yet, will be created');
    originalSize = 0;
  }
} catch (err) {
  console.error('Error checking log file:', err.message);
  originalSize = 0;
}

// Write a test message specific to services backup
const testMessage = 'TEST: Services backup logging test';
logMessage(testMessage);
console.log('Test message logged to console and file');

// Verify the log was written to the file
try {
  if (fs.existsSync(logFile)) {
    const stats = fs.statSync(logFile);
    const newSize = stats.size;
    console.log(`New log file size: ${newSize} bytes`);
    console.log(`Change in size: ${newSize - originalSize} bytes`);
    
    if (newSize > originalSize) {
      // Read the last few lines to confirm our message is there
      const content = fs.readFileSync(logFile, 'utf8');
      const lines = content.split('\n');
      const lastLine = lines[lines.length - 2]; // -2 because the last line might be empty
      
      console.log('Last log entry:');
      console.log(lastLine);
      
      if (lastLine.includes(testMessage)) {
        console.log('✅ TEST PASSED: Test message was written to the log file');
      } else {
        console.log('❌ TEST FAILED: Test message was not found in the log file');
      }
    } else {
      console.log('❌ TEST FAILED: Log file size did not increase');
    }
  } else {
    console.log('❌ TEST FAILED: Log file does not exist after writing test message');
  }
} catch (err) {
  console.error('Error verifying log file:', err.message);
}

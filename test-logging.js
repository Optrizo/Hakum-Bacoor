// Test script to verify logging to backup-logs.txt
import fs from 'fs';
import path from 'path';

// Setup logging function
const logFile = path.join(process.cwd(), 'backup-logs.txt');
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(message);
  
  // Also append to log file if possible
  try {
    fs.appendFileSync(logFile, logEntry);
    return true; // Successfully wrote to log file
  } catch (err) {
    console.error('Note: Could not write to log file:', err.message);
    return false; // Failed to write to log file
  }
};

// Test the logging function
console.log('Starting log test...');

// Clear the log file first to ensure a clean test
try {
  // Check if the file exists first
  if (fs.existsSync(logFile)) {
    // Read the current content to preserve it
    const currentLogs = fs.readFileSync(logFile, 'utf8');
    console.log(`Current log file size: ${currentLogs.length} bytes`);
  }
} catch (err) {
  console.error('Error checking log file:', err.message);
}

// Try to write test messages
const testMessage1 = 'Test log message 1';
const success1 = logMessage(testMessage1);
console.log(`Wrote test message 1: ${success1 ? 'SUCCESS' : 'FAILED'}`);

const testMessage2 = 'Test log message 2';
const success2 = logMessage(testMessage2);
console.log(`Wrote test message 2: ${success2 ? 'SUCCESS' : 'FAILED'}`);

// Verify the log file was updated
try {
  if (fs.existsSync(logFile)) {
    const updatedLogs = fs.readFileSync(logFile, 'utf8');
    const logLines = updatedLogs.split('\n').filter(line => line.trim() !== '');
    const lastTwoLines = logLines.slice(-2);
    
    console.log('Last two log entries:');
    lastTwoLines.forEach(line => console.log(line));
    
    // Check if our test messages are in the last two lines
    const containsTest1 = lastTwoLines.some(line => line.includes(testMessage1));
    const containsTest2 = lastTwoLines.some(line => line.includes(testMessage2));
    
    console.log(`Log contains test message 1: ${containsTest1 ? 'YES' : 'NO'}`);
    console.log(`Log contains test message 2: ${containsTest2 ? 'YES' : 'NO'}`);
    
    if (containsTest1 && containsTest2) {
      console.log('✅ TEST PASSED: Both test messages were written to the log file');
    } else {
      console.log('❌ TEST FAILED: Some test messages were not found in the log file');
    }
  } else {
    console.log('❌ TEST FAILED: Log file does not exist after writing test messages');
  }
} catch (err) {
  console.error('Error verifying log file:', err.message);
}

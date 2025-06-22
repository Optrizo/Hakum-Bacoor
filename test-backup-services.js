// Test script for running the backup-services.js
import { backupServicesToAirtable } from './api/backup-services.js';

console.log("Starting services backup test...");

backupServicesToAirtable()
  .then(result => {
    console.log("Backup test complete!");
    console.log("Result:", result);
    if (result.success) {
      console.log(`Successfully created ${result.created} records and updated ${result.updated} records.`);
    } else {
      console.error(`Backup failed: ${result.message}`);
    }
  })
  .catch(error => {
    console.error("Error running backup:", error);
  });

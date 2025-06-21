# Run the backup script and log the results
$backupPath = "c:\Users\User\Desktop\Hakum-Bacoor"
$logFile = "$backupPath\backup-logs.txt"

# Add a timestamp to the log
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $logFile -Value "===== SCHEDULED BACKUP STARTED AT $timestamp ====="

# Change to the backup directory
Set-Location -Path $backupPath

# Run the Node.js script
try {
    $output = node transfer-crew-data.js
    Add-Content -Path $logFile -Value $output
    Add-Content -Path $logFile -Value "Scheduled backup completed successfully at $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
} catch {
    Add-Content -Path $logFile -Value "ERROR: Scheduled backup failed: $_"
}

Add-Content -Path $logFile -Value "===== SCHEDULED BACKUP FINISHED ====="
Add-Content -Path $logFile -Value ""

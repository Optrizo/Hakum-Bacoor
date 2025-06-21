# Daily Backup Scheduler Setup Guide

This guide will help you set up an automated daily backup of crew members data from Supabase to Airtable at 12:00 AM Philippines time.

## Prerequisites
- Make sure Node.js is installed on your computer
- Ensure all required environment variables are set in the `.env` file
- The backup script (`transfer-crew-data.js`) is working correctly

## Setting up the Scheduled Task (Windows)

1. Open Windows Task Scheduler:
   - Press `Win + R` to open the Run dialog
   - Type `taskschd.msc` and press Enter

2. Create a new task:
   - Click on "Create Basic Task..." in the right panel
   - Name: "Hakum Bacoor Crew Data Backup"
   - Description: "Daily backup of crew members data from Supabase to Airtable at 12:00 AM Philippines time"
   - Click "Next"

3. Set the trigger:
   - Select "Daily" and click "Next"
   - Set the start time to 12:00:00 AM
   - Make sure "Recur every" is set to 1 days
   - Click "Next"

4. Set the action:
   - Select "Start a program" and click "Next"
   - In "Program/script", browse to the batch file: `c:\Users\User\Desktop\Hakum-Bacoor\run-backup.bat`
   - In "Start in", enter: `c:\Users\User\Desktop\Hakum-Bacoor`
   - Click "Next"

5. Review and finish:
   - Review your settings and click "Finish"

6. Modify advanced settings (optional but recommended):
   - Right-click on the newly created task and select "Properties"
   - On the "General" tab, check "Run whether user is logged on or not" for background execution
   - Check "Run with highest privileges"
   - On the "Conditions" tab, uncheck "Start the task only if the computer is on AC power"
   - On the "Settings" tab, check "Run task as soon as possible after a scheduled start is missed"
   - Click "OK" to save the changes
   - Enter your Windows password when prompted

## Testing the Scheduled Task

To verify that your task is set up correctly:
1. Right-click on the task in Task Scheduler
2. Select "Run"
3. Check the `backup-logs.txt` file to confirm the backup ran successfully

## Troubleshooting

If the scheduled task does not run:
1. Check Windows Event Viewer for error messages
2. Make sure the batch file path is correct
3. Ensure Node.js is in your system PATH
4. Verify that the `.env` file contains all required environment variables
5. Run the batch file manually to test if it works outside of the scheduler

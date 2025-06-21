# Supabase to Airtable Backup System

This system automatically backs up crew member data from Supabase to Airtable daily at 12:00 AM Philippines time.

## Features

- Incremental backup: Only transfers new records that don't already exist in Airtable
- Proper field mapping including handling of date fields and boolean values
- Batch processing to comply with Airtable API limits
- Detailed logging for monitoring and troubleshooting
- Automated daily backups at 12:00 AM Philippines time

## Setup

### Prerequisites

1. Node.js installed on your system
2. Environment variables properly configured in a `.env` file:
   ```   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_AIRTABLE_API_KEY=your_airtable_key
   VITE_AIRTABLE_BASE_ID=your_airtable_base_id
   VITE_AIRTABLE_TABLE_CREW=your_airtable_table_name
   ```

### Files Included

- `transfer-crew-data.js` - Main script that performs the backup operation
- `run-backup.bat` - Batch file for scheduling with Windows Task Scheduler
- `run-backup.ps1` - PowerShell script for more robust scheduling (alternative)
- `backup-scheduler-guide.md` - Detailed guide for setting up scheduled backups
- `backup-logs.txt` - Log file that will be created to record backup operations

### Running Manually

You can run the backup manually in two ways:

1. Using npm:
   ```
   npm run transfer-crew
   ```

2. Directly with Node.js:
   ```
   node transfer-crew-data.js
   ```

### Setting Up Automated Backups

Follow the detailed instructions in `backup-scheduler-guide.md` to set up automated daily backups at 12:00 AM Philippines time using Windows Task Scheduler.

## Monitoring and Troubleshooting

- Check the `backup-logs.txt` file for detailed logs of each backup operation
- The logs include timestamps, record counts, and any errors encountered
- If a backup fails, the log will contain error information to help diagnose the issue

## Field Mapping

The script maps the following fields from Supabase to Airtable:

| Supabase Field | Airtable Field | Notes |
|---------------|---------------|-------|
| id | id | Used to identify duplicate records |
| name | name | |
| phone | phone | |
| is_active | is_active | Mapped as "TRUE" or "FALSE" for Airtable single select |
| created_at | created_at | Formatted as ISO string |
| updated_at | updated_at | Formatted as ISO string |

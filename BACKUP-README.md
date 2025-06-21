# Supabase to Airtable Backup System

This system automatically backs up data from Supabase to Airtable daily.

## Features

- New records only: Only transfers new records that don't exist in Airtable, skipping updates to existing records
- Incremental backup: Compares records between Supabase and Airtable to identify only new entries
- Proper field mapping including handling of date fields and nested objects
- Batch processing to comply with Airtable API limits
- Detailed logging for monitoring and troubleshooting
- Automated daily backups at 12:00 AM Philippines time
- Schema detection: Works even with empty Airtable tables

## Setup

### Prerequisites

1. Node.js installed on your system
2. Environment variables properly configured in a `.env` file:
   ```   
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_key
   VITE_AIRTABLE_API_KEY=your_airtable_key
   VITE_AIRTABLE_BASE_ID=your_airtable_base_id
   VITE_AIRTABLE_TABLE_CREW=your_airtable_table_name
   VITE_AIRTABLE_TABLE_SERVICES=your_airtable_services_table_name
   ```

### Files Included

- `transfer-crew-data.js` - Script that performs the crew data backup operation
- `api/backup-crew-data.js` - API version of the crew backup script
- `api/backup-services.js` - Script that performs the services data backup operation
- `test-backup-services.js` - Test runner for the services backup script
- `test-schema-detection.js` - Test script for Airtable schema detection
- `run-backup.bat` - Batch file for scheduling with Windows Task Scheduler
- `run-backup.ps1` - PowerShell script for more robust scheduling (alternative)
- `backup-logs.txt` - Log file that will be created to record backup operations

### Running Manually

You can run the backups manually using npm:

1. For crew data:
   ```
   npm run backup:crew
   ```

2. For services data:
   ```
   npm run backup:services
   ```

3. Test the logging system:
   ```
   npm run test:logging
   ```

## Services Backup Implementation

The `backup-services.js` script handles backing up service records from Supabase to an Airtable table.

### Features

- **Schema Detection**: Uses the Airtable Metadata API to detect all fields in the Airtable table, even when the table is empty.
- **Field Mapping**: Maps Supabase fields to Airtable fields based on the detected schema.
- **Duplicate Prevention**: Avoids creating duplicate records by checking for existing IDs.
- **Batch Processing**: Processes records in batches to respect Airtable API limits.
- **Error Handling**: Provides detailed error reporting and continues processing despite individual record failures.

### Table Schema Detection

The script uses the Airtable Metadata API to detect the table schema, which works even when the table is empty. This is a significant improvement over the previous approach that relied on examining existing records.

**API Endpoint Used:**
```
GET https://api.airtable.com/v0/meta/bases/{baseId}/tables
```

This returns detailed information about all tables in the base, including their fields, types, and configurations.

### Fallback Mechanism

If the Metadata API fails for any reason, the script falls back to the traditional method of examining existing records. If no records exist, it uses a hardcoded set of default fields.

## Crew Data Field Mapping

The script maps the following fields from Supabase to Airtable:

| Supabase Field | Airtable Field | Notes |
|---------------|---------------|-------|
| id | id | Used to identify duplicate records |
| name | name | |
| phone | phone | |
| is_active | is_active | Mapped as "TRUE" or "FALSE" for Airtable single select |
| created_at | created_at | Formatted as ISO string |
| updated_at | updated_at | Formatted as ISO string |

## Services Field Mapping

The script maps the following fields from Supabase to Airtable (if they exist in the Airtable schema):

| Supabase Field | Airtable Field | Notes |
|---------------|---------------|-------|
| id | id | Used to identify duplicate records |
| name | name | |
| price | price | |
| description | description | |
| pricing.small | small | From nested pricing object |
| pricing.medium | medium | From nested pricing object |
| pricing.large | large | From nested pricing object |
| pricing.extra_large | extra_large | From nested pricing object |
| created_at | created_at | Formatted as YYYY-MM-DD |
| updated_at | updated_at | Formatted as YYYY-MM-DD |

## Logging System

The backup system includes a robust logging mechanism that:

1. Outputs logs to the console during execution
2. Simultaneously writes logs to a `backup-logs.txt` file in the project root
3. Includes timestamps in ISO format for accurate tracking
4. Captures all important events, errors, and backup statistics

This dual logging approach ensures that you have a persistent record of all backup operations, even when run through GitHub Actions, where logs are only temporarily available.

### Log File Format

Each log entry follows this format:

```
[TIMESTAMP] MESSAGE
```

Example:
```
[2025-06-21T15:42:02.083Z] === STARTING SERVICES BACKUP ===
[2025-06-21T15:42:02.532Z] Retrieved 24 services from Supabase
[2025-06-21T15:42:03.123Z] New: 3, Updates: 21
```

### Testing the Logging System

You can verify that the logging system is working correctly by running:

```
npm run test:logging
```

This will attempt to write test messages to the log file and verify that they were successfully written.

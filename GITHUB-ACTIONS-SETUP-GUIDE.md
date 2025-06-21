# GitHub Actions Backup Setup Guide

Follow these steps to set up the automated daily backup of your crew data from Supabase to Airtable using GitHub Actions.

## Prerequisites

- A GitHub account
- Your code pushed to a GitHub repository
- Administrator access to the repository
- Your Supabase and Airtable credentials

## Step 1: Push Your Code to GitHub

Make sure your repository includes:
- `transfer-crew-data.js` script
- `.github/workflows/daily-backup.yml` file
- `package.json` with the required dependencies

## Step 2: Set Up GitHub Secrets

1. Go to your GitHub repository in a web browser
2. Click on the "Settings" tab near the top right
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click on the "New repository secret" button
5. Add the following secrets one by one:

   | Secret Name | Value |
   |-------------|-------|
   | `VITE_SUPABASE_URL` | Your Supabase URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `VITE_AIRTABLE_API_KEY` | Your Airtable API key |
   | `VITE_AIRTABLE_BASE_ID` | Your Airtable base ID |
   | `VITE_AIRTABLE_TABLE_NAME` | Your Airtable table name |

   For each secret:
   - Enter the name exactly as shown above
   - Paste your actual value
   - Click "Add secret"

## Step 3: Test the Workflow Manually

1. Go to the "Actions" tab in your GitHub repository
2. You should see "Daily Crew Data Backup" in the workflows list
3. Click on it
4. Click the "Run workflow" button (dropdown on the right)
5. Click the green "Run workflow" button in the dialog
6. Wait for the workflow to complete (should take less than a minute)
7. Click on the completed run to view details
8. Check that all steps completed successfully
9. You can download the backup logs by clicking on the "Artifacts" section at the bottom of the run details

## Step 4: Verify the Data in Airtable

1. Go to your Airtable base
2. Check the "Crew" table
3. Verify that the data from Supabase has been transferred correctly

## Troubleshooting

If the workflow fails:

1. Click on the failed run in the Actions tab
2. Expand the step that failed to see the error message
3. Common issues include:
   - Incorrect GitHub secrets (check for typos)
   - Missing dependencies in package.json
   - Permissions issues with Supabase or Airtable
   - Rate limits or API restrictions

## Schedule Details

The backup is scheduled to run automatically at:
- 12:00 AM Philippines time (UTC+8)
- 4:00 PM UTC

The schedule is defined in the `.github/workflows/daily-backup.yml` file with the cron expression: `0 16 * * *`

## Monitoring

- Check the "Actions" tab regularly to ensure the workflow is running successfully
- Each run will save logs as artifacts that you can download and review
- Logs are retained for 30 days

## Modifying the Schedule

If you need to change the schedule:

1. Edit the `.github/workflows/daily-backup.yml` file
2. Modify the cron expression in the `schedule` section
3. Use a tool like [crontab.guru](https://crontab.guru/) to help create the right expression
4. Remember that GitHub Actions uses UTC time

Remember that for the scheduled workflows to run, your repository must have had some activity in the last 60 days.

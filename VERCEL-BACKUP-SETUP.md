# Vercel Cron Jobs Backup Setup Guide

This guide explains how to set up your Vercel project with the necessary environment variables for the automatic daily backup to work with Vercel Cron Jobs.

## Prerequisites

1. Your code is already deployed on Vercel
2. You have administrative access to the Vercel project
3. You have valid Supabase and Airtable credentials
4. You have a Vercel Pro or Enterprise account (required for Cron Jobs)

## Setting Up Vercel Environment Variables

The backup script relies on environment variables that need to be configured in your Vercel project.

Follow these steps to set up the required environment variables:

1. Go to your Vercel dashboard
2. Select your project
3. Click on "Settings" at the top
4. In the left sidebar, click on "Environment Variables"
5. Add each of the following variables one by one:

   | Variable Name | Value Description |
   |---------------|-------------------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
   | `VITE_AIRTABLE_API_KEY` | Your Airtable API key |
   | `VITE_AIRTABLE_BASE_ID` | Your Airtable base ID |
   | `VITE_AIRTABLE_TABLE_NAME` | Your Airtable table name |

6. For each variable, make sure it's available in all three environments (Production, Preview, and Development)
7. Click "Save" after entering each variable

## Enabling Vercel Cron Jobs

1. Make sure your Vercel account has the Pro or Enterprise plan (required for Cron Jobs)
2. Ensure that your `vercel.json` file contains the cron job configuration:
   ```json
   {
     "crons": [
       {
         "path": "/api/backup-crew-data",
         "schedule": "0 16 * * *"
       }
     ]
   }
   ```
3. This schedules the backup to run at 4:00 PM UTC (12:00 AM Philippines Time / UTC+8)
4. Deploy your project to Vercel with this configuration

## Verifying the Setup

1. Check the "Cron Jobs" section in your Vercel project dashboard
2. You should see the scheduled backup job listed
3. You can view logs of previous executions to verify if they're running successfully

## How It Works

- The cron job will call the API endpoint `/api/backup-crew-data` automatically every day at 12:00 AM Philippines time
- This endpoint will run the data transfer from Supabase to Airtable
- Logs will be available in the Vercel dashboard under "Cron Jobs" and "Functions"

## Troubleshooting

If the cron job fails:

1. Check the function logs in the Vercel dashboard
2. Verify all environment variables are correctly set up
3. Make sure your Supabase and Airtable credentials are valid and have the necessary permissions
4. Check if there are any rate limits or quotas you may be hitting

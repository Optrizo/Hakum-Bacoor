# GitHub Actions Backup Setup Guide

This guide explains how to set up your GitHub repository with the necessary secrets for the automatic daily backup to work with GitHub Actions.

## Prerequisites

1. Your code is already in a GitHub repository
2. You have administrative access to the repository
3. You have valid Supabase and Airtable credentials

## Setting Up GitHub Secrets

The backup script relies on environment variables that are stored as GitHub Secrets to keep your credentials secure.

Follow these steps to set up the required secrets:

1. Go to your GitHub repository
2. Click on "Settings" (tab at the top)
3. In the left sidebar, click on "Secrets and variables" > "Actions"
4. Click on "New repository secret"
5. Add each of the following secrets one by one:   | Secret Name | Value Description |
   |-------------|-------------------|
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
   | `VITE_AIRTABLE_API_KEY` | Your Airtable API key |
   | `VITE_AIRTABLE_BASE_ID` | Your Airtable base ID |
   | `VITE_AIRTABLE_TABLE_CREW` | Your Airtable table name |

6. Click "Add secret" after entering each secret

## Verifying the Workflow Setup

1. Make sure the `.github/workflows/daily-backup.yml` file is committed and pushed to your repository
2. Go to the "Actions" tab in your GitHub repository
3. You should see the "Daily Crew Data Backup" workflow listed
4. You can manually trigger the workflow by clicking on it, then clicking the "Run workflow" button

## How It Works

- The backup will run automatically every day at 12:00 AM Philippines time (4:00 PM UTC)
- Logs will be saved as artifacts in GitHub Actions for 30 days
- You can view the logs by going to the completed workflow run and downloading the artifacts

## Troubleshooting

If the workflow fails:

1. Check the workflow run logs in the GitHub Actions tab
2. Verify all secrets are correctly set up
3. Make sure your Supabase and Airtable credentials are valid and have the necessary permissions
4. Check if there are any rate limits or quotas you may be hitting

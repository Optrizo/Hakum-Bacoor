// Test script to verify that only new records are backed up to Airtable
import { createClient } from '@supabase/supabase-js';
import Airtable from 'airtable';
import dotenv from 'dotenv';
import { backupServicesToAirtable } from './api/backup-services.js';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Airtable
Airtable.configure({
  apiKey: process.env.VITE_AIRTABLE_API_KEY
});
const airtableBase = Airtable.base(process.env.VITE_AIRTABLE_BASE_ID);
const airtableTable = process.env.VITE_AIRTABLE_TABLE_SERVICES;

async function testNewRecordsOnly() {
  console.log('===== TESTING NEW RECORDS ONLY BACKUP =====');
  
  try {
    // Step 1: Get existing records count from Airtable
    console.log('Fetching existing records from Airtable...');
    const existingRecords = await airtableBase(airtableTable).select({
      fields: ['id']
    }).all();
    
    console.log(`Current Airtable records: ${existingRecords.length}`);
    const existingIds = new Set(existingRecords.map(record => record.fields.id));
    
    // Step 2: Get records from Supabase
    console.log('Fetching records from Supabase...');
    const { data: services, error } = await supabase
      .from('services')
      .select('*');
    
    if (error) {
      throw new Error(`Failed to fetch services from Supabase: ${error.message}`);
    }
    
    // Step 3: Identify records that would be new (i.e., not in Airtable)
    const newServices = services.filter(service => !existingIds.has(service.id));
    
    console.log(`Total Supabase services: ${services.length}`);
    console.log(`Records that would be new: ${newServices.length}`);
    console.log(`Records that already exist: ${services.length - newServices.length}`);
    
    // Step 4: Run the backup
    console.log('\n===== RUNNING BACKUP =====');
    const result = await backupServicesToAirtable();
    
    console.log('\n===== TEST RESULTS =====');
    if (result.success) {
      console.log('✅ Backup completed successfully');
      console.log(`Created records: ${result.created}`);
      console.log(`Updated records: ${result.updated}`);
      
      // Verify that only new records were created
      if (result.created === newServices.length && result.updated === 0) {
        console.log('✅ TEST PASSED: Only new records were backed up');
      } else if (result.created < newServices.length) {
        console.log('⚠️ TEST WARNING: Fewer records were created than expected');
        console.log(`Expected: ${newServices.length}, Actual: ${result.created}`);
      } else if (result.updated > 0) {
        console.log('❌ TEST FAILED: Some records were updated despite being configured to skip updates');
      }
    } else {
      console.log('❌ Backup failed');
      console.log(`Error: ${result.message}`);
    }
    
    // Run a second time to confirm no duplicates are created
    console.log('\n===== RUNNING BACKUP AGAIN TO TEST NO DUPLICATES =====');
    const secondResult = await backupServicesToAirtable();
    
    if (secondResult.success && secondResult.created === 0) {
      console.log('✅ TEST PASSED: No duplicates were created on second run');
    } else {
      console.log('❌ TEST FAILED: Second run created new records when it should not have');
      console.log(`Created: ${secondResult.created}`);
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testNewRecordsOnly();

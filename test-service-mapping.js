// Test script for service mapping with pricing
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { backupServicesToAirtable } from './api/backup-services.js';

dotenv.config();

async function testServiceMapping() {
  console.log('===== TESTING SERVICE MAPPING WITH PRICING =====');
  
  try {
    const result = await backupServicesToAirtable();
    
    console.log('\n===== TEST RESULTS =====');
    if (result.success) {
      console.log('✅ Backup completed successfully');
      console.log(`Created records: ${result.created}`);
      console.log(`Updated records: ${result.updated}`);
    } else {
      console.log('❌ Backup failed');
      console.log(`Error: ${result.message}`);
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testServiceMapping();

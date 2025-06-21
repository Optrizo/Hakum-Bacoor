// This file will be placed in the /api directory for Vercel to use with Cron Jobs
import { createClient } from '@supabase/supabase-js';
import Airtable from 'airtable';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Airtable
Airtable.configure({
  apiKey: process.env.VITE_AIRTABLE_API_KEY
});
const airtableBase = Airtable.base(process.env.VITE_AIRTABLE_BASE_ID);
const airtableTable = process.env.VITE_AIRTABLE_TABLE_NAME;

// Function to transfer only new records from Supabase to Airtable
async function transferData() {
  try {
    console.log('===== STARTING INCREMENTAL DATA TRANSFER =====');
    console.log(`Backup started at: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (Philippines Time)`);
    
    // Fetch data from Supabase
    const { data: crewMembers, error } = await supabase
      .from('crew_members')
      .select('*');
    
    if (error) {
      throw new Error(`Error fetching data from Supabase: ${error.message}`);
    }
    
    console.log(`Retrieved ${crewMembers.length} crew members from Supabase`);

    // Fetch existing records from Airtable to compare
    console.log('Fetching existing records from Airtable for comparison...');
    const existingAirtableRecords = await airtableBase(airtableTable).select().all();
    console.log(`Retrieved ${existingAirtableRecords.length} existing records from Airtable`);
    
    // Create a map of existing records by Supabase ID for easy lookup
    const existingRecordMap = new Map();
    existingAirtableRecords.forEach(record => {
      // Check if the record has an id field that matches a Supabase ID
      if (record.fields.id) {
        existingRecordMap.set(record.fields.id, record);
      }
    });
    
    // Filter out crew members that already exist in Airtable
    const newCrewMembers = crewMembers.filter(member => !existingRecordMap.has(member.id));
    console.log(`Found ${newCrewMembers.length} new records to transfer`);
    
    if (newCrewMembers.length === 0) {
      console.log('No new records to transfer. All Supabase records already exist in Airtable.');
      console.log('===== BACKUP COMPLETED - NO NEW RECORDS =====');
      return { success: true, message: 'No new records to transfer', newRecords: 0 };
    }
    
    // Prepare data for Airtable
    // Airtable has a max of 10 records per create operation
    const batches = [];
    const batchSize = 10;
    
    for (let i = 0; i < newCrewMembers.length; i += batchSize) {
      batches.push(newCrewMembers.slice(i, i + batchSize));
    }
    
    // Transfer data in batches
    let successCount = 0;
    
    for (const [index, batch] of batches.entries()) {
      console.log(`Processing batch ${index + 1} of ${batches.length}...`);
      const airtableRecords = batch.map(member => {
        // Create a fields object with the correct field names we discovered
        const fields = {};
        
        // Use the exact field names from your Airtable table
        if (member.name) fields['name'] = member.name;
        if (member.phone) fields['phone'] = member.phone;
        
        // Map is_active to a single select with "TRUE" or "FALSE" values
        fields['is_active'] = member.is_active ? "TRUE" : "FALSE";
        
        // Add the id field
        if (member.id) fields['id'] = member.id;
        
        // Add the created_at field if it exists in the Supabase record
        if (member.created_at) {
          // Format the date as expected by Airtable (ISO string)
          fields['created_at'] = new Date(member.created_at).toISOString();
        }
        
        // Add the updated_at field if it exists in the Supabase record
        if (member.updated_at) {
          // Format the date as expected by Airtable (ISO string)
          fields['updated_at'] = new Date(member.updated_at).toISOString();
        }
        
        return { fields };
      });
      
      try {
        const createdRecords = await airtableBase(airtableTable).create(airtableRecords);
        successCount += createdRecords.length;
        console.log(`Batch ${index + 1} completed successfully - ${createdRecords.length} records created`);
      } catch (err) {
        console.error(`Error creating records in batch ${index + 1}:`, err);
        console.log('Attempting to continue with next batch...');
      }
    }
    
    console.log(`===== BACKUP COMPLETED - ${successCount} new records transferred to Airtable =====`);
    return { success: true, message: 'Backup completed successfully', newRecords: successCount };
  } catch (error) {
    console.error('ERROR DURING DATA TRANSFER:', error);
    return { success: false, message: `Error during data transfer: ${error.message}` };
  }
}

// Export the handler for Vercel Serverless Functions
export default async function handler(req, res) {
  // Check if this is a scheduled execution or an unauthorized access
  const isAuthorizedCron = req.headers['x-vercel-cron'] === '1';
  const isLocalDevelopment = process.env.NODE_ENV === 'development';
  
  if (!isAuthorizedCron && !isLocalDevelopment) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  
  try {
    console.log('===== BACKUP PROCESS STARTED =====');
    const result = await transferData();
    console.log('Backup process completed');
    
    return res.status(200).json({
      success: true,
      message: result.message,
      timestamp: new Date().toISOString(),
      philippinesTime: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
      ...result
    });
  } catch (error) {
    console.error('ERROR IN MAIN PROCESS:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error in backup process: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}

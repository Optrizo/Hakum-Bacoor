import { createClient } from '@supabase/supabase-js';
import Airtable from 'airtable';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Setup logging - works in both local and cloud environments
const logFile = path.join(process.cwd(), 'backup-logs.txt');
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(message);
  
  // Also append to log file if possible (might not work in some cloud environments)
  try {
    // Ensure the directory exists
    fs.appendFileSync(logFile, logEntry);
  } catch (err) {
    console.error('Note: Could not write to log file:', err.message);
  }
};

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Airtable
Airtable.configure({
  apiKey: process.env.VITE_AIRTABLE_API_KEY
});
const airtableBase = Airtable.base(process.env.VITE_AIRTABLE_BASE_ID);
const airtableTable = process.env.VITE_AIRTABLE_TABLE_CREW;

// Function to set up the Airtable table if it doesn't exist or has no fields
async function setupAirtableTable() {
  try {
    console.log('Setting up Airtable table structure...');
    
    // Check if the table has any records
    const existingRecords = await airtableBase(airtableTable).select({ maxRecords: 1 }).all();
    
    if (existingRecords.length === 0) {
      console.log('Creating initial record to set up table structure...');
      
      // Create a sample record to set up the table structure
      const sampleRecord = {
        fields: {
          'Name': 'Sample Crew Member (Delete Me)',
          'Phone': '123-456-7890',
          'Is Active': true,
          'Supabase ID': 'sample-id',
          'Created': new Date().toISOString().split('T')[0],
          'Last Modified': new Date().toISOString().split('T')[0],
          'Notes': 'This is a sample record to set up the table structure. You can delete it.'
        }
      };
      
      await airtableBase(airtableTable).create([sampleRecord]);
      console.log('Sample record created successfully. Table structure is now set up.');
      return true;
    } else {
      console.log('Table already has records. No setup needed.');
      return false;
    }
  } catch (error) {
    console.error('Error setting up Airtable table:', error);
    return false;
  }
}

// Function to transfer only new records from Supabase to Airtable
async function transferData() {
  try {
    logMessage('=== STARTING CREW DATA BACKUP ===');
    logMessage(`Started: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })}`);
    
    // Fetch data from Supabase
    const { data: crewMembers, error } = await supabase
      .from('crew_members')
      .select('*');
    
    if (error) {
      throw new Error(`Error fetching data from Supabase: ${error.message}`);
    }
    
    logMessage(`Retrieved ${crewMembers.length} crew members from Supabase`);

    // Fetch existing records from Airtable to compare
    const existingAirtableRecords = await airtableBase(airtableTable).select().all();
    logMessage(`Retrieved ${existingAirtableRecords.length} existing records from Airtable`);
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
    logMessage(`New records to transfer: ${newCrewMembers.length}`);
    
    if (newCrewMembers.length === 0) {
      logMessage('No new records to transfer');
      logMessage('=== BACKUP COMPLETE - NO NEW RECORDS ===');
      return;
    }
    
    // Prepare data for Airtable
    // Airtable has a max of 10 records per create operation
    const batches = [];
    const batchSize = 10;
    
    for (let i = 0; i < newCrewMembers.length; i += batchSize) {
      batches.push(newCrewMembers.slice(i, i + batchSize));
    }    // Transfer data in batches
    let successCount = 0;
    
    for (const [index, batch] of batches.entries()) {
      logMessage(`Processing batch ${index + 1}/${batches.length}...`);
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
        logMessage(`Batch ${index + 1}/${batches.length}: ${createdRecords.length} created`);
      } catch (err) {
        logMessage(`Error in batch ${index + 1}: ${err.message}`);
      }
    }
    
    logMessage(`=== BACKUP COMPLETE - ${successCount} new records created ===`);  } catch (error) {
    logMessage(`ERROR: ${error.message}`);
    process.exit(1);
  }
}

// Function to check Airtable table structure
async function checkAirtableStructure() {
  try {
    console.log('Checking Airtable table structure...');
    
    // Make a special request to get table metadata including field names
    // This is a workaround since Airtable API doesn't directly expose schema
    const tableUrl = `https://api.airtable.com/v0/meta/bases/${process.env.VITE_AIRTABLE_BASE_ID}/tables`;
    
    // Since we can't use fetch directly in this environment, we'll use another approach    console.log('Please check your Airtable table structure manually by:');
    console.log('1. Go to https://airtable.com/');
    console.log(`2. Open your base (${process.env.VITE_AIRTABLE_BASE_ID})`);
    console.log(`3. Open the table "${process.env.VITE_AIRTABLE_TABLE_CREW}"`);
    console.log('4. Check the exact names of the fields');
    
    // Let's try a simpler approach - create a record with all possible field variations
    console.log('Attempting to create a record with various field name formats...');
    
    const fieldVariations = {
      // Common field name variations
      'Name': 'Sample Name',
      'name': 'Sample Name',
      'NAME': 'Sample Name',
      'Full Name': 'Sample Name',
      'FullName': 'Sample Name',
      
      'Phone': '123-456-7890',
      'phone': '123-456-7890',
      'PHONE': '123-456-7890',
      'Phone Number': '123-456-7890',
      'PhoneNumber': '123-456-7890',
      
      'Active': true,
      'IsActive': true,
      'Is Active': true,
      'is_active': true,
      'Status': 'Active',
      
      'ID': 'sample-id',
      'Id': 'sample-id',
      'Supabase ID': 'sample-id',
      'SupabaseID': 'sample-id',
      'External ID': 'sample-id',
      
      'Created': new Date().toISOString(),
      'Created At': new Date().toISOString(),
      'CreatedAt': new Date().toISOString(),
      'Creation Date': new Date().toISOString(),
      
      'Notes': 'Sample notes'
    };
    
    try {
      await airtableBase(airtableTable).create([{ fields: fieldVariations }]);
      console.log('Successfully created a test record with field variations!');
      console.log('Please check your Airtable to see which fields were accepted.');
      console.log('Then update the script with the correct field names.');
    } catch (error) {
      console.error('Error creating test record:', error.message);
      
      // Let's try to extract field names from the error message
      if (error.message.includes('Unknown field name')) {
        console.log('First field name rejected. Let\'s try one by one...');
        
        // Try each field individually
        for (const [fieldName, value] of Object.entries(fieldVariations)) {
          try {
            const singleField = {};
            singleField[fieldName] = value;
            await airtableBase(airtableTable).create([{ fields: singleField }]);
            console.log(`SUCCESS: Field "${fieldName}" is valid!`);
          } catch (fieldError) {
            if (fieldError.message.includes('Unknown field name')) {
              console.log(`FAILED: Field "${fieldName}" is not valid.`);
            } else {
              console.log(`ERROR with field "${fieldName}":`, fieldError.message);
            }
          }
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking Airtable structure:', error);
    return false;
  }
}

// Update the main function to now actually transfer the data
async function main() {
  try {
    logMessage('=== BACKUP PROCESS STARTED ===');
    // We've already checked the structure, now let's transfer the data
    await transferData();
    logMessage('Backup completed');
  } catch (error) {
    logMessage(`ERROR: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();

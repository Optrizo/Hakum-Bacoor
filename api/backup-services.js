// Script to backup services data from Supabase to Airtable
import { createClient } from '@supabase/supabase-js';
import Airtable from 'airtable';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

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
const airtableApiKey = process.env.VITE_AIRTABLE_API_KEY;
const airtableBaseId = process.env.VITE_AIRTABLE_BASE_ID;

/**
 * Get table schema using the Airtable Metadata API
 * This will work even when the table has no records
 */
async function getAirtableTableSchema() {
  try {
    console.log('Retrieving Airtable table schema using Metadata API...');
    const url = `https://api.airtable.com/v0/meta/bases/${airtableBaseId}/tables`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${airtableApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Metadata API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const tables = data.tables || [];
    
    // Find our specific table
    const targetTable = tables.find(table => table.name === airtableTable);
    
    if (!targetTable) {
      console.warn(`Table "${airtableTable}" not found in base schema`);
      return [];
    }
    
    // Extract field names
    const fields = targetTable.fields.map(field => field.name);
    console.log(`Retrieved ${fields.length} fields from Airtable schema: ${fields.join(', ')}`);
    
    return fields;
  } catch (error) {
    console.error('Error retrieving Airtable table schema:', error);
    return null;
  }
}

/**
 * Format a date string for Airtable
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted date string (YYYY-MM-DD)
 */
function formatDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  } catch (error) {
    console.warn(`Error formatting date ${dateString}: ${error.message}`);
    return null;
  }
}

async function backupServicesToAirtable() {
  try {
    console.log('===== STARTING SERVICES DATA BACKUP =====');
    console.log(`Backup started at: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })} (Philippines Time)`);
    
    // Get existing records from Airtable first to avoid duplicates
    console.log('Fetching existing records from Airtable for comparison...');
    const existingRecords = await airtableBase(airtableTable).select({
      fields: ['id']
    }).all();
    
    const existingIds = new Set(existingRecords.map(record => record.fields.id));
    console.log(`Found ${existingIds.size} existing services in Airtable.`);
    
    // Fetch all services from Supabase
    const { data: services, error } = await supabase
      .from('services')
      .select('*');
    
    if (error) {
      throw new Error(`Failed to fetch services from Supabase: ${error.message}`);
    }
    
    console.log(`Retrieved ${services.length} services from Supabase.`);
      // Filter out services that already exist in Airtable
    const newServices = services.filter(service => !existingIds.has(service.id));
    const servicesToUpdate = services.filter(service => existingIds.has(service.id));
    
    console.log(`Found ${newServices.length} new services to create and ${servicesToUpdate.length} services to update.`);
    
    if (newServices.length === 0 && servicesToUpdate.length === 0) {
      console.log('No new or updated services to process. Backup completed.');
      return { 
        success: true, 
        message: 'No new or updated services found', 
        created: 0, 
        updated: 0 
      };
    }
    
    // Get table schema to know what fields exist, even if the table is empty
    let availableFields = [];
    
    // Try to get fields from the Metadata API first
    const schemaFields = await getAirtableTableSchema();
    
    if (schemaFields && schemaFields.length > 0) {
      availableFields = schemaFields;
    } else {
      // Fallback to the old method - checking existing records
      console.log('Falling back to detecting fields from existing records...');
      try {
        // Fetch at least one record to see the fields structure
        const sampleRecords = await airtableBase(airtableTable).select({
          maxRecords: 1
        }).all();
        
        if (sampleRecords && sampleRecords.length > 0) {
          // Get the available field names from the sample record
          availableFields = Object.keys(sampleRecords[0].fields || {});
        } else {
          // If no records exist, use fields we know exist based on our check
          availableFields = ['id', 'name', 'price', 'description'];
        }
      } catch (error) {
        console.warn('Could not determine field structure from Airtable, proceeding with basic fields only.');
        // Default to known fields if we can't get the structure
        availableFields = ['id', 'name', 'price', 'description'];
      }
    }
    
    console.log(`Available fields in Airtable: ${availableFields.join(', ')}`);// Prepare records for creation or update
    const recordsToCreate = [];
    const recordsToUpdate = [];
      console.log('\n===== PROCESSING SERVICES FOR AIRTABLE =====');
    
    // Process only new services for creation
    console.log(`Processing ${newServices.length} new services for creation...`);
    newServices.forEach((service, index) => {
      console.log(`\nProcessing new service ${index + 1}/${newServices.length}: ${service.name} (ID: ${service.id})`);
      
      // Create a fields object with the correct field names for Airtable
      // Only include fields that exist in Airtable
      const fields = {};
      
      // Create a mapping of all fields from Supabase to Airtable
      const fieldMappings = {
        // Standard fields (direct mapping)
        'id': service.id,
        'name': service.name,
        'price': service.price,
        'description': service.description,
        
        // Pricing fields - these are nested in Supabase but flat in Airtable
        'small': service.pricing?.small,
        'medium': service.pricing?.medium,
        'large': service.pricing?.large,
        'extra_large': service.pricing?.extra_large,
          // Date fields need special formatting
        'created_at': service.created_at ? formatDate(service.created_at) : null,
        // In Airtable, the field is now updated_at (previously was update_at)
        'updated_at': service.updated_at ? formatDate(service.updated_at) : null
      };
        // Only include fields that exist in Airtable schema
      for (const [fieldName, fieldValue] of Object.entries(fieldMappings)) {
        if (availableFields.includes(fieldName) && fieldValue !== null && fieldValue !== undefined) {
          fields[fieldName] = fieldValue;
        }
      }
        // Log what fields were mapped
      console.log(`Mapped fields for ${service.name}:`, Object.keys(fields).join(', '));
      if (service.pricing) {
        console.log(`Pricing data mapped: small=${fields.small || 'N/A'}, medium=${fields.medium || 'N/A'}, large=${fields.large || 'N/A'}, extra_large=${fields.extra_large || 'N/A'}`);
      }
      
      // Log any missing required fields
      if (!fields.id || !fields.name) {
        console.warn(`Service is missing required fields: id=${service.id}, name=${service.name}`);
      }
      
      // Only proceed if we have at least the required fields (id and name)
      if (fields.id && fields.name) {
        recordsToCreate.push({
          fields: fields
        });
      } else {
        console.warn(`Skipping service with id ${service.id || 'unknown'} due to missing required fields`);
      }
    });
      // Create new records
    let createdCount = 0;
    if (recordsToCreate.length > 0) {
      console.log(`Creating ${recordsToCreate.length} new records in Airtable...`);
      
      // Process in batches of 10 to respect Airtable API limits
      const batches = [];
      const batchSize = 10;
      
      for (let i = 0; i < recordsToCreate.length; i += batchSize) {
        batches.push(recordsToCreate.slice(i, i + batchSize));
      }
      
      for (const [index, batch] of batches.entries()) {
        try {
          const createdRecords = await airtableBase(airtableTable).create(batch);
          createdCount += createdRecords.length;
          console.log(`Create batch ${index + 1}/${batches.length} completed - ${createdRecords.length} records created`);
        } catch (err) {
          console.error(`Error creating records in batch ${index + 1}:`, err);
          console.log('Attempting to continue with next batch...');
        }
      }
    }
    
    // Skip updates since we're only backing up new records
    console.log('Skipping updates as requested - only backing up new records.');
    const updatedCount = 0;
    
    console.log(`===== SERVICES BACKUP COMPLETED - Created: ${createdCount}, Updated: ${updatedCount} =====`);
    return { 
      success: true, 
      message: 'Services backup completed successfully', 
      created: createdCount, 
      updated: updatedCount 
    };
  } catch (error) {
    console.error('ERROR DURING SERVICES BACKUP:', error);
    return { 
      success: false, 
      message: `Error during services backup: ${error.message}` 
    };
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
    console.log('===== SERVICES BACKUP PROCESS STARTED =====');
    const result = await backupServicesToAirtable();
    console.log('Services backup process completed');
    
    return res.status(200).json({
      success: true,
      message: result.message,
      created: result.created,
      updated: result.updated,
      timestamp: new Date().toISOString(),
      philippinesTime: new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })
    });
  } catch (error) {
    console.error('ERROR IN MAIN PROCESS:', error);
    
    return res.status(500).json({
      success: false,
      message: `Error in services backup process: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}

// Check if this file is being run directly
const isMainModule = process.argv[1] === import.meta.url.substring(7); // Remove "file://"
if (isMainModule) {
  backupServicesToAirtable()
    .then(result => {
      if (result.success) {
        console.log(`Backup summary: Created ${result.created}, Updated ${result.updated}`);
        process.exit(0);
      } else {
        console.error(`Backup failed: ${result.message}`);
        process.exit(1);
      }
    });
}

// Export for use in other modules
export { backupServicesToAirtable };

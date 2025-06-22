// Script to backup services data from Supabase to Airtable
import { createClient } from '@supabase/supabase-js';
import Airtable from 'airtable';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Setup logging - works in both local and cloud environments
const logFile = path.join(process.cwd(), 'backup-logs.txt');
const logMessage = (message) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  console.log(message);
  
  // Also append to log file if possible
  try {
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
const airtableTable = process.env.VITE_AIRTABLE_TABLE_SERVICES;
const airtableApiKey = process.env.VITE_AIRTABLE_API_KEY;
const airtableBaseId = process.env.VITE_AIRTABLE_BASE_ID;

/**
 * Get table schema using the Airtable Metadata API
 * This will work even when the table has no records
 */
async function getAirtableTableSchema() {
  try {
    logMessage('Retrieving Airtable table schema...');
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
      logMessage(`Table "${airtableTable}" not found in base schema`);
      return [];
    }
    
    // Extract field names
    const fields = targetTable.fields.map(field => field.name);
    logMessage(`Retrieved ${fields.length} fields from schema`);
    
    return fields;
  } catch (error) {
    logMessage(`Error retrieving Airtable table schema: ${error.message}`);
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
    logMessage(`Error formatting date ${dateString}: ${error.message}`);
    return null;
  }
}

async function backupServicesToAirtable() {
  try {
    logMessage('=== STARTING SERVICES BACKUP ===');
    logMessage(`Started: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' })}`);
    
    // Get existing records from Airtable first to avoid duplicates
    const existingRecords = await airtableBase(airtableTable).select({
      fields: ['id']
    }).all();
    
    const existingIds = new Set(existingRecords.map(record => record.fields.id));
    logMessage(`Found ${existingIds.size} existing services in Airtable`);
    
    // Fetch all services from Supabase
    const { data: services, error } = await supabase
      .from('services')
      .select('*');
    
    if (error) {
      throw new Error(`Failed to fetch services from Supabase: ${error.message}`);
    }
    
    logMessage(`Retrieved ${services.length} services from Supabase`);
      // Filter out services that already exist in Airtable
    const newServices = services.filter(service => !existingIds.has(service.id));
    const servicesToUpdate = services.filter(service => existingIds.has(service.id));
    
    logMessage(`New: ${newServices.length}, Updates: ${servicesToUpdate.length}`);
      if (newServices.length === 0 && servicesToUpdate.length === 0) {
      logMessage('No new or updated services. Backup completed.');
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
    } else {      // Fallback to the old method - checking existing records
      logMessage('Falling back to detect fields from existing records');
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
        }      } catch (error) {
        logMessage('Could not determine field structure, using basic fields');
        // Default to known fields if we can't get the structure
        availableFields = ['id', 'name', 'price', 'description'];
      }
    }
    
    // Prepare records for creation or update
    const recordsToCreate = [];
    const recordsToUpdate = [];
    logMessage('=== PROCESSING SERVICES ===');
      // Process only new services for creation
    logMessage(`Processing ${newServices.length} new services...`);
    newServices.forEach((service, index) => {
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
        // Log any missing required fields
      if (!fields.id || !fields.name) {
        logMessage(`Service missing required fields: id=${service.id}, name=${service.name}`);
      }
      
      // Only proceed if we have at least the required fields (id and name)
      if (fields.id && fields.name) {
        recordsToCreate.push({
          fields: fields
        });
      } else {
        logMessage(`Skipping service with id ${service.id || 'unknown'}`);
      }
    });    // Create new records
    let createdCount = 0;
    if (recordsToCreate.length > 0) {
      logMessage(`Creating ${recordsToCreate.length} new records...`);
      
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
          logMessage(`Batch ${index + 1}/${batches.length}: ${createdRecords.length} created`);
        } catch (err) {
          logMessage(`Error in batch ${index + 1}: ${err.message}`);
        }
      }
    }
    
    // Skip updates since we're only backing up new records
    logMessage('Skipping updates - only backing up new records');
    const updatedCount = 0;
    
    logMessage(`=== BACKUP COMPLETE - Created: ${createdCount}, Updated: ${updatedCount} ===`);
    return { 
      success: true, 
      message: 'Services backup completed successfully', 
      created: createdCount, 
      updated: updatedCount 
    };  } catch (error) {
    logMessage(`ERROR: ${error.message}`);
    return { 
      success: false, 
      message: `Error during backup: ${error.message}` 
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
    logMessage('=== SERVICES BACKUP STARTED ===');
    const result = await backupServicesToAirtable();
    
    return res.status(200).json({
      success: true,
      message: result.message,
      created: result.created,
      updated: result.updated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logMessage(`ERROR: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      message: `Error: ${error.message}`,
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
        logMessage(`Backup summary: Created ${result.created}, Updated ${result.updated}`);
        process.exit(0);
      } else {
        logMessage(`Backup failed: ${result.message}`);
        process.exit(1);
      }
    });
}

// Export for use in other modules
export { backupServicesToAirtable };

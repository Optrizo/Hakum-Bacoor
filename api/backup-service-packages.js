// Script to backup service packages from Supabase to Airtable
import { createClient } from '@supabase/supabase-js';
import Airtable from 'airtable';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Initialize logging
const logFile = 'backup-logs.txt';
const logMessage = (message, verbose = false) => {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [SP_BACKUP] ${message}\n`;
  
  // Always write to log file but only output to console if not verbose or if in verbose mode
  fs.appendFileSync(logFile, logEntry);
  if (!verbose || process.env.VERBOSE_LOGGING === 'true') {
    console.log(logEntry.trim());
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
const airtableServicePackagesTable = process.env.VITE_AIRTABLE_TABLE_SERVICE_PACKAGES;
const airtableServicesTable = process.env.VITE_AIRTABLE_TABLE_SERVICES;

/**
 * Get a mapping of service IDs between Supabase and Airtable
 * This will be needed to properly link service_packages to services
 */
async function getServiceIdMapping() {
  logMessage('Fetching service ID mapping...');
    try {
    // Get all services from Supabase
    const { data: supabaseServices, error: supabaseError } = await supabase
      .from('services')
      .select('id, name');
    
    if (supabaseError) throw new supabaseError;
    
    logMessage(`Got ${supabaseServices.length} Supabase services`);
    
    // Get all services from Airtable
    const airtableServices = await airtableBase(airtableServicesTable)
      .select({
        fields: ['id', 'name']
      })
      .all();
    
    logMessage(`Got ${airtableServices.length} Airtable services`);
    
    // For debugging, log some sample records (verbose only)
    if (supabaseServices.length > 0) {
      logMessage(`Sample Supabase service: ${JSON.stringify(supabaseServices[0])}`, true);
    }
    
    if (airtableServices.length > 0) {
      logMessage(`Sample Airtable service: ${JSON.stringify(airtableServices[0].fields)}`, true);
    }
      // Create mapping by service name (assuming name is unique)
    const mapping = {};
    let mappedCount = 0;
    let unmappedCount = 0;
    
    supabaseServices.forEach(supabaseService => {
      const matchingAirtableService = airtableServices.find(
        airtableService => airtableService.fields.name === supabaseService.name
      );
      
      if (matchingAirtableService) {
        mapping[supabaseService.id] = matchingAirtableService.id;
        logMessage(`Mapped: ${supabaseService.name}`, true);
        mappedCount++;
      } else {
        logMessage(`Unmapped: ${supabaseService.name} (${supabaseService.id})`, true);
        unmappedCount++;
      }
    });
    
    logMessage(`Mapped ${mappedCount}/${supabaseServices.length} services`);
    return mapping;
  } catch (error) {
    logMessage(`Error creating service ID mapping: ${error.message}`);
    return {};
  }
}

/**
 * Backup service packages from Supabase to Airtable
 */
async function backupServicePackages() {  try {
    logMessage('Starting service packages backup...');
    
    // Get service ID mapping
    const serviceIdMapping = await getServiceIdMapping();
    
    // Get existing records from Airtable to avoid duplicates
    const existingRecords = await airtableBase(airtableServicePackagesTable)
      .select({
        fields: ['id']
      })
      .all();
    
    const existingIds = new Set(
      existingRecords.map(record => record.fields.id)
    );
    
    logMessage(`Found ${existingIds.size} existing Airtable records`);
    
    // Fetch all service packages from Supabase
    const { data: servicePackages, error } = await supabase
      .from('service_packages')
      .select('*');
      
    if (error) throw error;
    
    logMessage(`Got ${servicePackages.length} Supabase packages`);
      // Log a sample record to understand structure
    if (servicePackages.length > 0) {
      logMessage(`Record schema: ${JSON.stringify(Object.keys(servicePackages[0]))}`, true);
    }
    
    // Filter out records that already exist in Airtable
    const newRecords = servicePackages.filter(pkg => !existingIds.has(pkg.id));
    
    logMessage(`Found ${newRecords.length} new records to add`);
    
    if (newRecords.length === 0) {
      logMessage('No new records. Backup complete.');
      return { added: 0, total: servicePackages.length };
    }
    
    // Prepare records for Airtable
    const airtableRecords = newRecords.map(pkg => {      // Log service_ids for debugging
      logMessage(`Package "${pkg.name}": ${pkg.service_ids?.length || 0} services`, true);
      
      // Convert service_ids array to Airtable record IDs
      let linkedServiceIds = [];
      let mappedCount = 0;
      let missingCount = 0;
      
      if (Array.isArray(pkg.service_ids) && pkg.service_ids.length > 0) {
        linkedServiceIds = pkg.service_ids
          .map(id => {
            const airtableId = serviceIdMapping[id];
            if (!airtableId) {
              logMessage(`Unmapped ID: ${id} in "${pkg.name}"`, true);
              missingCount++;
              return null;
            }
            mappedCount++;
            return airtableId;
          })
          .filter(id => id); // Remove any undefined/null mappings
        
        if (missingCount > 0) {
          logMessage(`⚠️ "${pkg.name}": ${missingCount} unmapped IDs`, true);
        }
      } else {
        logMessage(`"${pkg.name}": No service_ids found`, true);
      }
        if (linkedServiceIds.length === 0 && pkg.service_ids && pkg.service_ids.length > 0) {
        logMessage(`⚠️ "${pkg.name}": All IDs failed to map`, true);
      }
      
      // Get pricing information
      const pricing = pkg.pricing || {};
      
      return {
        fields: {
          id: pkg.id,
          name: pkg.name,
          description: pkg.description || '',
          service_ids: linkedServiceIds,
          small: typeof pricing.small === 'number' ? pricing.small : (parseFloat(pricing.small) || 0),
          medium: typeof pricing.medium === 'number' ? pricing.medium : (parseFloat(pricing.medium) || 0),
          large: typeof pricing.large === 'number' ? pricing.large : (parseFloat(pricing.large) || 0),
          extra_large: typeof pricing.extra_large === 'number' ? pricing.extra_large : (parseFloat(pricing.extra_large) || 0),
          is_active: pkg.is_active ? 'TRUE' : 'FALSE',
          created_at: pkg.created_at || new Date().toISOString(),
          updated_at: pkg.updated_at || new Date().toISOString()
        }
      };
    });
      // Create records in batches (Airtable has a limit of 10 records per request)
    const BATCH_SIZE = 10;
    let addedCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < airtableRecords.length; i += BATCH_SIZE) {
      const batch = airtableRecords.slice(i, i + BATCH_SIZE);
      logMessage(`Batch ${i / BATCH_SIZE + 1}/${Math.ceil(airtableRecords.length / BATCH_SIZE)}`);
      
      try {
        const createdRecords = await airtableBase(airtableServicePackagesTable).create(batch);
        addedCount += createdRecords.length;
        logMessage(`Batch ${i / BATCH_SIZE + 1} success: ${createdRecords.length} records`);
      } catch (error) {
        failedCount += batch.length;
        logMessage(`❌ Batch error: ${error.message}`);
        
        // If the error has error.error.message, it's an Airtable API error
        if (error.error && error.error.message) {
          logMessage(`❌ API error: ${error.error.message}`, true);
        }
      }
    }
      logMessage(`Complete: Added ${addedCount}/${servicePackages.length} records`);
    if (failedCount > 0) {
      logMessage(`⚠️ Failed: ${failedCount} records`);
    }
    return { added: addedCount, failed: failedCount, total: servicePackages.length };
    
  } catch (error) {
    logMessage(`❌ Error: ${error.message}`);
    throw error;
  }
}

// Run the backup
backupServicePackages()
  .then(result => {
    logMessage(`Summary: Added ${result.added}/${result.total} records`);
    if (result.failed > 0) {
      logMessage(`⚠️ Failed: ${result.failed} records`);
    }
    process.exit(0);
  })
  .catch(error => {
    logMessage(`❌ Failed: ${error.message}`);
    process.exit(1);
  });

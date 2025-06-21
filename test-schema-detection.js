// Test script to verify the Airtable schema detection works even with empty tables
import { createClient } from '@supabase/supabase-js';
import Airtable from 'airtable';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

// Initialize Airtable
Airtable.configure({
  apiKey: process.env.VITE_AIRTABLE_API_KEY
});

const airtableBaseId = process.env.VITE_AIRTABLE_BASE_ID;
const airtableTable = process.env.VITE_AIRTABLE_TABLE_SERVICES;
const airtableApiKey = process.env.VITE_AIRTABLE_API_KEY;

/**
 * Test function to retrieve table schema using the Airtable Metadata API
 * This will work even when the table has no records
 */
async function testSchemaDetection() {
  try {
    console.log('TESTING: Retrieving Airtable table schema using Metadata API...');
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
    console.log('All tables in base:', data.tables.map(table => table.name));
    
    // Find our specific table
    const targetTable = data.tables.find(table => table.name === airtableTable);
    
    if (!targetTable) {
      console.warn(`Table "${airtableTable}" not found in base schema`);
      console.log('Available tables:', data.tables.map(table => table.name));
      return;
    }
    
    console.log('\n===== TABLE SCHEMA DETAILS =====');
    console.log(`Table Name: ${targetTable.name}`);
    console.log(`Table ID: ${targetTable.id}`);
    if (targetTable.description) console.log(`Description: ${targetTable.description}`);
    
    // Extract field details
    console.log('\n===== FIELDS =====');
    const fields = targetTable.fields || [];
    
    fields.forEach(field => {
      console.log(`- ${field.name} (${field.type})`);
      if (field.description) console.log(`  Description: ${field.description}`);
    });
    
    // Now let's simulate detecting fields from an empty table using traditional method
    console.log('\n===== SIMULATING EMPTY TABLE DETECTION =====');
    const emptyTableFields = await detectFieldsFromEmptyTable();
    console.log(`Fields detected from empty table simulation: ${emptyTableFields.length ? emptyTableFields.join(', ') : 'None'}`);
    
    console.log('\n===== DETECTING FIELDS FROM METADATA API =====');
    const fieldNames = fields.map(field => field.name);
    console.log(`Fields detected from Metadata API: ${fieldNames.join(', ')}`);
    
    return {
      metadataFields: fieldNames,
      emptyTableFields: emptyTableFields
    };
  } catch (error) {
    console.error('Error during test:', error);
  }
}

/**
 * Simulate attempting to get fields from an empty table
 * This should fail or return an empty array
 */
async function detectFieldsFromEmptyTable() {
  try {
    console.log('Simulating detecting fields from an empty Airtable table...');
    const airtableBase = Airtable.base(airtableBaseId);
    
    // We'll use a filter that should return no records to simulate empty table
    const sampleRecords = await airtableBase(airtableTable).select({
      maxRecords: 1,
      filterByFormula: "AND({id} = 'non-existent-id')" // This should return no records
    }).all();
    
    if (sampleRecords && sampleRecords.length > 0) {
      const fields = Object.keys(sampleRecords[0].fields || {});
      console.log(`Traditional method found ${fields.length} fields from a record`);
      return fields;
    } else {
      console.log('Traditional method found no records, would fall back to default fields');
      return [];
    }
  } catch (error) {
    console.error('Error in traditional detection method:', error);
    return [];
  }
}

// Run the test
testSchemaDetection()
  .then(result => {
    console.log('\n===== TEST SUMMARY =====');
    if (result) {
      console.log(`Metadata API detected ${result.metadataFields.length} fields`);
      console.log(`Traditional method detected ${result.emptyTableFields.length} fields`);
      
      if (result.metadataFields.length > 0 && result.emptyTableFields.length === 0) {
        console.log('\n✅ TEST PASSED: Metadata API successfully detected fields when the table appears empty');
      } else if (result.emptyTableFields.length > 0) {
        console.log('\n⚠️ TEST INCONCLUSIVE: Traditional method found records despite our filter');
      } else {
        console.log('\n❌ TEST FAILED: Neither method detected fields');
      }
    } else {
      console.log('❌ TEST FAILED: No result returned');
    }
  })
  .catch(error => {
    console.error('Test failed with error:', error);
  });

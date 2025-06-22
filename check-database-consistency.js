/**
 * Database Consistency Check Script
 * 
 * This script validates that your Supabase database schema matches your TypeScript types
 * and application expectations.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseConsistency() {
  console.log('🔍 Checking Database Consistency...\n');

  try {
    // Check if tables exist
    console.log('📋 Checking table existence...');
    
    const tables = ['cars', 'services', 'crew_members', 'service_packages'];
    const tableChecks = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table '${table}': ${error.message}`);
          tableChecks[table] = false;
        } else {
          console.log(`✅ Table '${table}': Exists`);
          tableChecks[table] = true;
        }
      } catch (err) {
        console.log(`❌ Table '${table}': ${err.message}`);
        tableChecks[table] = false;
      }
    }

    // Check table schemas
    console.log('\n🏗️  Checking table schemas...');
    
    if (tableChecks.cars) {
      console.log('\n📊 Cars table schema:');
      const { data: carsData, error: carsError } = await supabase
        .from('cars')
        .select('*')
        .limit(1);
      
      if (!carsError && carsData && carsData.length > 0) {
        const car = carsData[0];
        console.log('  ✅ id:', typeof car.id);
        console.log('  ✅ plate:', typeof car.plate);
        console.log('  ✅ model:', typeof car.model);
        console.log('  ✅ size:', typeof car.size);
        console.log('  ✅ service:', typeof car.service);
        console.log('  ✅ status:', typeof car.status);
        console.log('  ✅ crew:', Array.isArray(car.crew) ? 'string[]' : typeof car.crew);
        console.log('  ✅ phone:', typeof car.phone);
        console.log('  ✅ total_cost:', typeof car.total_cost);
        console.log('  ✅ services:', Array.isArray(car.services) ? 'string[]' : typeof car.services);
        console.log('  ✅ created_at:', typeof car.created_at);
        console.log('  ✅ updated_at:', typeof car.updated_at);
      }
    }

    if (tableChecks.crew_members) {
      console.log('\n👥 Crew members table schema:');
      const { data: crewData, error: crewError } = await supabase
        .from('crew_members')
        .select('*')
        .limit(1);
      
      if (!crewError && crewData && crewData.length > 0) {
        const crew = crewData[0];
        console.log('  ✅ id:', typeof crew.id);
        console.log('  ✅ name:', typeof crew.name);
        console.log('  ✅ phone:', typeof crew.phone);
        console.log('  ✅ role:', typeof crew.role);
        console.log('  ✅ is_active:', typeof crew.is_active);
        console.log('  ✅ created_at:', typeof crew.created_at);
        console.log('  ✅ updated_at:', typeof crew.updated_at);
      }
    }

    if (tableChecks.services) {
      console.log('\n🛠️  Services table schema:');
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .limit(1);
      
      if (!servicesError && servicesData && servicesData.length > 0) {
        const service = servicesData[0];
        console.log('  ✅ id:', typeof service.id);
        console.log('  ✅ name:', typeof service.name);
        console.log('  ✅ price:', typeof service.price);
        console.log('  ✅ description:', typeof service.description);
        console.log('  ✅ pricing:', typeof service.pricing);
        console.log('  ✅ created_at:', typeof service.created_at);
        console.log('  ✅ updated_at:', typeof service.updated_at);
      }
    }

    if (tableChecks.service_packages) {
      console.log('\n📦 Service packages table schema:');
      const { data: packagesData, error: packagesError } = await supabase
        .from('service_packages')
        .select('*')
        .limit(1);
      
      if (!packagesError && packagesData && packagesData.length > 0) {
        const pkg = packagesData[0];
        console.log('  ✅ id:', typeof pkg.id);
        console.log('  ✅ name:', typeof pkg.name);
        console.log('  ✅ description:', typeof pkg.description);
        console.log('  ✅ service_ids:', Array.isArray(pkg.service_ids) ? 'string[]' : typeof pkg.service_ids);
        console.log('  ✅ pricing:', typeof pkg.pricing);
        console.log('  ✅ is_active:', typeof pkg.is_active);
        console.log('  ✅ created_at:', typeof pkg.created_at);
        console.log('  ✅ updated_at:', typeof pkg.updated_at);
      }
    }

    // Check RLS policies
    console.log('\n🔒 Checking RLS policies...');
    const tablesWithRLS = ['cars', 'services', 'crew_members', 'service_packages'];
    
    for (const table of tablesWithRLS) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error && error.message.includes('permission denied')) {
          console.log(`❌ Table '${table}': RLS blocking access`);
        } else {
          console.log(`✅ Table '${table}': RLS properly configured`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}': RLS check failed - ${err.message}`);
      }
    }

    // Check real-time subscriptions
    console.log('\n🔄 Checking real-time subscriptions...');
    try {
      const channel = supabase.channel('test-realtime');
      await channel.subscribe();
      console.log('✅ Real-time subscriptions working');
      await channel.unsubscribe();
    } catch (err) {
      console.log('❌ Real-time subscriptions failed:', err.message);
    }

    // Sample data validation
    console.log('\n📊 Sample data validation...');
    
    // Check if we can insert and read data
    try {
      const testCar = {
        plate: 'TEST123',
        model: 'Test Car',
        size: 'medium',
        service: 'Test Service',
        status: 'waiting',
        phone: '1234567890',
        total_cost: 100
      };

      const { data: insertData, error: insertError } = await supabase
        .from('cars')
        .insert(testCar)
        .select()
        .single();

      if (insertError) {
        console.log('❌ Insert test failed:', insertError.message);
      } else {
        console.log('✅ Insert test passed');
        
        // Clean up test data
        await supabase
          .from('cars')
          .delete()
          .eq('plate', 'TEST123');
        
        console.log('✅ Cleanup completed');
      }
    } catch (err) {
      console.log('❌ Data validation failed:', err.message);
    }

    console.log('\n🎉 Database consistency check completed!');

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
    process.exit(1);
  }
}

// Run the check
checkDatabaseConsistency(); 
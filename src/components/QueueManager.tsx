import React, { useState, useEffect } from 'react';
import QueueList from './QueueList';
import AddCarForm from './AddCarForm';
import { Plus, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useQueue } from '../context/QueueContext';

const QueueManager: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [tables, setTables] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [carTest, setCarTest] = useState<{ plate: string; model: string } | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const { cars, loading, error: queueError } = useQueue();

  useEffect(() => {
    async function fetchTables() {
      // This query fetches the list of tables in the public schema
      const { data, error } = await supabase.rpc('pg_catalog.pg_tables', { schemaname: 'public' });
      if (error) {
        setError(error.message);
      } else if (data) {
        setTables(data.map((row: any) => row.tablename));
      }
    }
    fetchTables();
  }, []);

  useEffect(() => {
    async function fetchCarTest() {
      const { data, error } = await supabase.from('cars').select('plate,model').limit(1).single();
      if (error) {
        setTestError(error.message);
      } else if (data) {
        setCarTest({ plate: data.plate, model: data.model });
      } else {
        setTestError('No cars found in database.');
      }
    }
    fetchCarTest();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (queueError) {
    return <div className="text-red-500">Error: {queueError}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Service Queue</h1>
          <p className="text-gray-400">Manage your auto service queue and track progress</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(prev => !prev)}
          className={`mt-4 md:mt-0 flex items-center px-4 py-2 font-medium rounded-md shadow-lg transition-colors ${
            showAddForm 
              ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' 
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {showAddForm ? (
            <>
              <X className="h-5 w-5 mr-1" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-1" />
              Add Vehicle
            </>
          )}
        </button>
      </div>

      {showAddForm && (
        <div className="bg-black shadow-lg rounded-lg p-6 border-l-4 border-blue-600 animate-fadeIn border border-gray-800">
          <AddCarForm onComplete={() => setShowAddForm(false)} />
        </div>
      )}

      <QueueList cars={cars} />
    </div>
  );
};

export default QueueManager;
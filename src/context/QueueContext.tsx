import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Car, Service, CrewMember, ServicePackage } from '../types';
import { supabase } from '../lib/supabase';

interface QueueContextType {
  cars: Car[];
  services: Service[];
  crews: CrewMember[];
  packages: ServicePackage[];
  loading: boolean;
  error: string | null;
  addCar: (car: Omit<Car, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCar: (id: string, updates: Partial<Car>) => Promise<void>;
  removeCar: (id: string) => Promise<void>;
  addCrew: (crew: Omit<CrewMember, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateCrew: (id: string, updates: Partial<CrewMember>) => Promise<void>;
  removeCrew: (id: string) => Promise<void>;
  addService: (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateService: (id: string, updates: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  addPackage: (pkg: Omit<ServicePackage, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updatePackage: (id: string, updates: Partial<ServicePackage>) => Promise<void>;
  deletePackage: (id: string) => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshPackages: () => Promise<void>;
  refreshCars: () => Promise<void>;
}

const QueueContext = createContext<QueueContextType | undefined>(undefined);

export const QueueProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [crews, setCrews] = useState<CrewMember[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track active operations to prevent conflicts
  const activeOperationsRef = useRef<Set<string>>(new Set());
  const subscriptionsRef = useRef<any[]>([]);

  // Optimistic update helpers
  const addActiveOperation = useCallback((operation: string) => {
    activeOperationsRef.current.add(operation);
  }, []);

  const removeActiveOperation = useCallback((operation: string) => {
    activeOperationsRef.current.delete(operation);
  }, []);

  const isOperationActive = useCallback((operation: string) => {
    return activeOperationsRef.current.has(operation);
  }, []);

  const fetchCars = useCallback(async () => {
    if (isOperationActive('cars-fetch')) return;
    
    try {
      addActiveOperation('cars-fetch');
      setError(null);

      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching cars:', error);
        throw error;
      }
      
      const transformedCars = (data || []).map(car => ({
        ...car,
        services: car.services || [],
        crew: car.crew || [],
        total_cost: car.total_cost || 0,
        created_at: car.created_at || new Date().toISOString(),
        updated_at: car.updated_at || new Date().toISOString(),
      }));
      
      setCars(transformedCars);
      console.log('Cars fetched successfully:', transformedCars.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching cars:', err);
      setError(errorMessage);
    } finally {
      removeActiveOperation('cars-fetch');
    }
  }, [addActiveOperation, removeActiveOperation, isOperationActive]);

  const fetchServices = useCallback(async () => {
    if (isOperationActive('services-fetch')) return;
    
    try {
      addActiveOperation('services-fetch');
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error fetching services:', error);
        throw error;
      }
      
      setServices(data || []);
      console.log('Services fetched successfully:', (data || []).length);
    } catch (err) {
      console.error('Error fetching services:', err);
    } finally {
      removeActiveOperation('services-fetch');
    }
  }, [addActiveOperation, removeActiveOperation, isOperationActive]);

  const fetchCrews = useCallback(async () => {
    if (isOperationActive('crews-fetch')) return;
    
    try {
      addActiveOperation('crews-fetch');
      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error fetching crews:', error);
        throw error;
      }
      
      setCrews(data || []);
      console.log('Crew members fetched successfully:', (data || []).length);
    } catch (err) {
      console.error('Error fetching crews:', err);
    } finally {
      removeActiveOperation('crews-fetch');
    }
  }, [addActiveOperation, removeActiveOperation, isOperationActive]);

  const fetchPackages = useCallback(async () => {
    if (isOperationActive('packages-fetch')) return;
    
    try {
      addActiveOperation('packages-fetch');
      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error fetching packages:', error);
        throw error;
      }
      
      setPackages(data || []);
      console.log('Service packages fetched successfully:', (data || []).length);
    } catch (err) {
      console.error('Error fetching packages:', err);
    } finally {
      removeActiveOperation('packages-fetch');
    }
  }, [addActiveOperation, removeActiveOperation, isOperationActive]);

  useEffect(() => {
    // Initial data fetch
    Promise.all([
      fetchCars(),
      fetchServices(),
      fetchCrews(),
      fetchPackages()
    ]).finally(() => {
      setLoading(false);
    });

    // Set up simplified real-time subscriptions
    const carsChannel = supabase
      .channel('cars-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'cars' 
        },
        () => {
          // Simple debounced refetch
          setTimeout(() => {
            if (!isOperationActive('cars-fetch')) {
              fetchCars();
            }
          }, 500);
        }
      )
      .subscribe();

    const servicesChannel = supabase
      .channel('services-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'services' 
        },
        () => {
          // Only refetch if not currently performing service operations
          setTimeout(() => {
            if (!isOperationActive('services-fetch') && !isOperationActive('service-operation')) {
              fetchServices();
            }
          }, 1000); // Longer delay for services to prevent typing interruption
        }
      )
      .subscribe();

    const crewsChannel = supabase
      .channel('crews-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'crew_members' 
        },
        () => {
          setTimeout(() => {
            if (!isOperationActive('crews-fetch')) {
              fetchCrews();
            }
          }, 500);
        }
      )
      .subscribe();

    const packagesChannel = supabase
      .channel('packages-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'service_packages' 
        },
        () => {
          setTimeout(() => {
            if (!isOperationActive('packages-fetch') && !isOperationActive('package-operation')) {
              fetchPackages();
            }
          }, 1000); // Longer delay for packages to prevent typing interruption
        }
      )
      .subscribe();

    // Store subscriptions for cleanup
    subscriptionsRef.current = [carsChannel, servicesChannel, crewsChannel, packagesChannel];

    return () => {
      console.log('Cleaning up subscriptions...');
      subscriptionsRef.current.forEach(channel => channel.unsubscribe());
    };
  }, [fetchCars, fetchServices, fetchCrews, fetchPackages, isOperationActive]);

  const addCar = async (car: Omit<Car, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      addActiveOperation('car-operation');
      setError(null);
      console.log('Adding car:', car);
      
      const { data, error } = await supabase
        .from('cars')
        .insert([{
          plate: car.plate,
          model: car.model,
          size: car.size,
          service: car.service,
          status: car.status,
          phone: car.phone,
          crew: car.crew || [],
          services: car.services || [],
          total_cost: car.total_cost || 0,
        }])
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding car:', error);
        throw error;
      }
      
      console.log('Car added successfully:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add car';
      console.error('Error adding car:', err);
      setError(errorMessage);
      throw err;
    } finally {
      removeActiveOperation('car-operation');
    }
  };

  const updateCar = async (id: string, updates: Partial<Car>) => {
    try {
      addActiveOperation('car-operation');
      setError(null);
      console.log('Updating car:', id, updates);
      
      const { data, error } = await supabase
        .from('cars')
        .update({ 
          ...updates, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating car:', error);
        throw error;
      }
      
      console.log('Car updated successfully:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update car';
      console.error('Error updating car:', err);
      setError(errorMessage);
      throw err;
    } finally {
      removeActiveOperation('car-operation');
    }
  };

  const removeCar = async (id: string) => {
    try {
      addActiveOperation('car-operation');
      setError(null);
      console.log('Removing car:', id);
      
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error removing car:', error);
        throw error;
      }
      
      console.log('Car removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove car';
      console.error('Error removing car:', err);
      setError(errorMessage);
      throw err;
    } finally {
      removeActiveOperation('car-operation');
    }
  };

  const addCrew = async (crew: Omit<CrewMember, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      addActiveOperation('crew-operation');
      console.log('Adding crew member:', crew);
      
      const { data, error } = await supabase
        .from('crew_members')
        .insert([crew])
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding crew member:', error);
        throw error;
      }
      
      console.log('Crew member added successfully:', data);
    } catch (err) {
      console.error('Error adding crew member:', err);
      throw err;
    } finally {
      removeActiveOperation('crew-operation');
    }
  };

  const updateCrew = async (id: string, updates: Partial<CrewMember>) => {
    try {
      addActiveOperation('crew-operation');
      console.log('Updating crew member:', id, updates);
      
      const { data, error } = await supabase
        .from('crew_members')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating crew member:', error);
        throw error;
      }
      
      console.log('Crew member updated successfully:', data);
    } catch (err) {
      console.error('Error updating crew member:', err);
      throw err;
    } finally {
      removeActiveOperation('crew-operation');
    }
  };

  const removeCrew = async (id: string) => {
    try {
      addActiveOperation('crew-operation');
      console.log('Removing crew member:', id);
      
      const { error } = await supabase
        .from('crew_members')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Supabase error removing crew member:', error);
        throw error;
      }
      
      console.log('Crew member removed successfully');
    } catch (err) {
      console.error('Error removing crew member:', err);
      throw err;
    } finally {
      removeActiveOperation('crew-operation');
    }
  };

  const addService = async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      addActiveOperation('service-operation');
      console.log('Adding service:', service);
      
      const { data, error } = await supabase
        .from('services')
        .insert([service])
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding service:', error);
        throw error;
      }
      
      console.log('Service added successfully:', data);
    } catch (err) {
      console.error('Error adding service:', err);
      throw err;
    } finally {
      removeActiveOperation('service-operation');
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      addActiveOperation('service-operation');
      console.log('Updating service:', id, updates);
      
      const { data, error } = await supabase
        .from('services')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating service:', error);
        throw error;
      }
      
      console.log('Service updated successfully:', data);
    } catch (err) {
      console.error('Error updating service:', err);
      throw err;
    } finally {
      removeActiveOperation('service-operation');
    }
  };

  const deleteService = async (id: string) => {
    try {
      addActiveOperation('service-operation');
      console.log('Deleting service:', id);
      
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting service:', error);
        throw error;
      }
      
      console.log('Service deleted successfully');
    } catch (err) {
      console.error('Error deleting service:', err);
      throw err;
    } finally {
      removeActiveOperation('service-operation');
    }
  };

  const addPackage = async (pkg: Omit<ServicePackage, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      addActiveOperation('package-operation');
      console.log('Adding package:', pkg);
      
      const { data, error } = await supabase
        .from('service_packages')
        .insert([pkg])
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding package:', error);
        throw error;
      }
      
      console.log('Package added successfully:', data);
    } catch (err) {
      console.error('Error adding package:', err);
      throw err;
    } finally {
      removeActiveOperation('package-operation');
    }
  };

  const updatePackage = async (id: string, updates: Partial<ServicePackage>) => {
    try {
      addActiveOperation('package-operation');
      console.log('Updating package:', id, updates);
      
      const { data, error } = await supabase
        .from('service_packages')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating package:', error);
        throw error;
      }
      
      console.log('Package updated successfully:', data);
    } catch (err) {
      console.error('Error updating package:', err);
      throw err;
    } finally {
      removeActiveOperation('package-operation');
    }
  };

  const deletePackage = async (id: string) => {
    try {
      addActiveOperation('package-operation');
      console.log('Deleting package:', id);
      
      const { error } = await supabase
        .from('service_packages')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting package:', error);
        throw error;
      }
      
      console.log('Package deleted successfully');
    } catch (err) {
      console.error('Error deleting package:', err);
      throw err;
    } finally {
      removeActiveOperation('package-operation');
    }
  };

  const refreshServices = async () => {
    if (isOperationActive('services-fetch')) return;
    
    try {
      addActiveOperation('services-fetch');
      setError(null);

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error refreshing services:', error);
        throw error;
      }
      
      setServices(data || []);
      console.log('Services refreshed successfully:', (data || []).length);
    } catch (err) {
      console.error('Error refreshing services:', err);
    } finally {
      removeActiveOperation('services-fetch');
    }
  };

  const refreshPackages = async () => {
    if (isOperationActive('packages-fetch')) return;
    
    try {
      addActiveOperation('packages-fetch');
      setError(null);

      const { data, error } = await supabase
        .from('service_packages')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Supabase error refreshing packages:', error);
        throw error;
      }
      
      setPackages(data || []);
      console.log('Packages refreshed successfully:', (data || []).length);
    } catch (err) {
      console.error('Error refreshing packages:', err);
    } finally {
      removeActiveOperation('packages-fetch');
    }
  };

  return (
    <QueueContext.Provider value={{ 
      cars, 
      services,
      crews,
      packages,
      loading, 
      error, 
      addCar, 
      updateCar, 
      removeCar,
      addCrew,
      updateCrew,
      removeCrew,      addService,
      updateService,
      deleteService,
      addPackage,
      updatePackage,
      deletePackage,
      refreshServices,
      refreshPackages,
      refreshCars: fetchCars
    }}>
      {children}
    </QueueContext.Provider>
  );
};

export const useQueue = () => {
  const context = useContext(QueueContext);
  if (context === undefined) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
};
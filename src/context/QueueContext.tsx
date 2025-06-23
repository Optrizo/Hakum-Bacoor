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
  searchCarHistory: (plate: string) => Promise<Car | null>;
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching cars:', err);
      setError(`Failed to load queue: ${errorMessage}`);
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching services:', err);
      setError(`Failed to load services: ${errorMessage}`);
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching crews:', err);
      setError(`Failed to load crew members: ${errorMessage}`);
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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error fetching packages:', err);
      setError(`Failed to load service packages: ${errorMessage}`);
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
    // Input validation
    if (!car.plate || !car.model || !car.size || !car.status) {
      throw new Error('Missing required fields: plate, model, size, and status are required.');
    }

    // Sanitize and validate plate format
    const plateRegex = /^[A-Z]{3}-?\d{3,4}$/;
    if (!plateRegex.test(car.plate.toUpperCase())) {
      throw new Error('Invalid license plate format. Please use format: ABC-1234 or ABC1234');
    }

    // Validate phone number if provided
    if (car.phone && car.phone.trim()) {
      const phoneRegex = /^(09|\+639)\d{9}$/;
      if (!phoneRegex.test(car.phone.replace(/\s/g, ''))) {
        throw new Error('Invalid phone number format. Please use Philippine format: 09XXXXXXXXX or +639XXXXXXXXX');
      }
    }

    // Validate total cost
    if (car.total_cost < 0) {
      throw new Error('Total cost cannot be negative.');
    }

    // Sanitize inputs
    const sanitizedCar = {
      ...car,
      plate: car.plate.toUpperCase().trim(),
      model: car.model.trim(),
      phone: car.phone ? car.phone.trim() : '',
      service: car.service ? car.service.trim() : '',
      total_cost: Math.max(0, car.total_cost)
    };

    try {
      const { data, error } = await supabase
        .from('cars')
        .insert([sanitizedCar])
        .select();

      if (error) {
        console.error('Supabase error adding car:', error);
        
        // Handle specific error cases
        if (error.code === '23505' && error.message.includes('plate')) {
          throw new Error('A vehicle with this license plate already exists in the queue.');
        } else if (error.code === '23502') {
          throw new Error('Please fill in all required fields.');
        } else if (error.code === '23514') {
          throw new Error('Invalid data provided. Please check your input.');
        } else if (error.code === '42501') {
          throw new Error('Access denied. You do not have permission to perform this action.');
        } else if (error.code === '42P01') {
          throw new Error('Database table not found. Please contact support.');
        } else {
          throw new Error(`Failed to add vehicle: ${error.message}`);
        }
      }

      if (data) {
        // No need for manual state update, subscription will trigger refetch
      }
    } catch (err) {
      console.error('Error in addCar:', err);
      // Re-throw the error so the UI component can handle it
      if (err instanceof Error) {
        throw err;
      } else {
        throw new Error('Failed to add new vehicle.');
      }
    }
  };

  const updateCar = async (id: string, updates: Partial<Car>) => {
    const operationId = `car-update-${id}`;
    if (isOperationActive(operationId)) return;

    // Validate ID
    if (!id || typeof id !== 'string') {
      throw new Error('Invalid vehicle ID provided.');
    }

    // Sanitize and validate updates
    const sanitizedUpdates: Partial<Car> = {};
    
    if (updates.plate !== undefined) {
      const plateRegex = /^[A-Z]{3}-?\d{3,4}$/;
      if (!plateRegex.test(updates.plate.toUpperCase())) {
        throw new Error('Invalid license plate format. Please use format: ABC-1234 or ABC1234');
      }
      sanitizedUpdates.plate = updates.plate.toUpperCase().trim();
    }

    if (updates.model !== undefined) {
      if (!updates.model.trim()) {
        throw new Error('Car model cannot be empty.');
      }
      sanitizedUpdates.model = updates.model.trim();
    }

    if (updates.phone !== undefined) {
      if (updates.phone && updates.phone.trim()) {
        const phoneRegex = /^(09|\+639)\d{9}$/;
        if (!phoneRegex.test(updates.phone.replace(/\s/g, ''))) {
          throw new Error('Invalid phone number format. Please use Philippine format: 09XXXXXXXXX or +639XXXXXXXXX');
        }
      }
      sanitizedUpdates.phone = updates.phone ? updates.phone.trim() : '';
    }

    if (updates.total_cost !== undefined) {
      if (updates.total_cost < 0) {
        throw new Error('Total cost cannot be negative.');
      }
      sanitizedUpdates.total_cost = Math.max(0, updates.total_cost);
    }

    // Add other fields that don't need special validation
    if (updates.size !== undefined) sanitizedUpdates.size = updates.size;
    if (updates.status !== undefined) sanitizedUpdates.status = updates.status;
    if (updates.service !== undefined) sanitizedUpdates.service = updates.service ? updates.service.trim() : '';
    if (updates.services !== undefined) sanitizedUpdates.services = updates.services;
    if (updates.crew !== undefined) sanitizedUpdates.crew = updates.crew;

    try {
      addActiveOperation(operationId);
      const { error } = await supabase
        .from('cars')
        .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('Supabase error updating car:', error);
        if (error.code === '42501') {
          throw new Error('Access denied. You do not have permission to update this vehicle.');
        } else if (error.code === '42P01') {
          throw new Error('Database table not found. Please contact support.');
        } else {
        throw new Error(`Failed to update vehicle: ${error.message}`);
        }
      }
    } catch (err) {
      console.error('Error in updateCar:', err);
      // Re-throw the original error if it's already an Error instance
      if (err instanceof Error) {
        throw err;
      }
      throw new Error(`An unknown error occurred while updating the vehicle.`);
    } finally {
      removeActiveOperation(operationId);
    }
  };

  const removeCar = async (id: string) => {
    const operationId = `car-remove-${id}`;
    if (isOperationActive(operationId)) return;

    try {
      addActiveOperation(operationId);
      const { error } = await supabase
        .from('cars')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error removing car:', error);
        throw new Error(`Failed to remove vehicle: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in removeCar:', err);
       if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown error occurred while removing the vehicle.');
    } finally {
      removeActiveOperation(operationId);
    }
  };

  const addCrew = async (crew: Omit<CrewMember, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .insert([{ ...crew }]);

      if (error) {
        console.error('Supabase error adding crew member:', error);
        throw new Error(`Failed to add crew member: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in addCrew:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown error occurred while adding a crew member.');
    }
  };

  const updateCrew = async (id: string, updates: Partial<CrewMember>) => {
    const operationId = `crew-update-${id}`;
    if (isOperationActive(operationId)) return;

    try {
      addActiveOperation(operationId);
      const { error } = await supabase
        .from('crew_members')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Supabase error updating crew member:', error);
        throw new Error(`Failed to update crew member: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in updateCrew:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown error occurred while updating a crew member.');
    } finally {
      removeActiveOperation(operationId);
    }
  };

  const removeCrew = async (id: string) => {
    const operationId = `crew-remove-${id}`;
    if (isOperationActive(operationId)) return;
    
    try {
      addActiveOperation(operationId);
      const { error } = await supabase
        .from('crew_members')
        .delete()
        .eq('id', id);
        
      if (error) {
        console.error('Supabase error removing crew member:', error);
        throw new Error(`Failed to remove crew member: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in removeCrew:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown error occurred while removing a crew member.');
    } finally {
      removeActiveOperation(operationId);
    }
  };

  const addService = async (service: Omit<Service, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      addActiveOperation('service-operation');
      const { error } = await supabase
        .from('services')
        .insert([{ ...service }]);

      if (error) {
        console.error('Supabase error adding service:', error);
        throw new Error(`Failed to add service: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in addService:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown error occurred while adding a service.');
    } finally {
      removeActiveOperation('service-operation');
    }
  };

  const updateService = async (id: string, updates: Partial<Service>) => {
    try {
      addActiveOperation('service-operation');
      const { error } = await supabase
        .from('services')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Supabase error updating service:', error);
        throw new Error(`Failed to update service: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in updateService:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown error occurred while updating a service.');
    } finally {
      removeActiveOperation('service-operation');
    }
  };

  const deleteService = async (id: string) => {
    try {
      addActiveOperation('service-operation');
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting service:', error);
        throw new Error(`Failed to delete service: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in deleteService:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown error occurred while deleting a service.');
    } finally {
      removeActiveOperation('service-operation');
    }
  };

  const addPackage = async (pkg: Omit<ServicePackage, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      addActiveOperation('package-operation');
      const { error } = await supabase
        .from('service_packages')
        .insert([{ ...pkg }]);

      if (error) {
        console.error('Supabase error adding package:', error);
        throw new Error(`Failed to add package: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in addPackage:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown error occurred while adding a package.');
    } finally {
      removeActiveOperation('package-operation');
    }
  };

  const updatePackage = async (id: string, updates: Partial<ServicePackage>) => {
    try {
      addActiveOperation('package-operation');
      const { error } = await supabase
        .from('service_packages')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Supabase error updating package:', error);
        throw new Error(`Failed to update package: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in updatePackage:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown error occurred while updating a package.');
    } finally {
      removeActiveOperation('package-operation');
    }
  };

  const deletePackage = async (id: string) => {
    try {
      addActiveOperation('package-operation');
      const { error } = await supabase
        .from('service_packages')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Supabase error deleting package:', error);
        throw new Error(`Failed to delete package: ${error.message}`);
      }
    } catch (err) {
      console.error('Error in deletePackage:', err);
      if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown error occurred while deleting a package.');
    } finally {
      removeActiveOperation('package-operation');
    }
  };

  const searchCarHistory = async (plate: string) => {
    // Input validation
    if (!plate || typeof plate !== 'string') {
      throw new Error('Invalid license plate provided for search.');
    }

    // Sanitize and validate plate format
    const sanitizedPlate = plate.trim().toUpperCase();
    if (sanitizedPlate.length < 3) {
      throw new Error('License plate must be at least 3 characters long.');
    }

    // Prevent potential SQL injection by limiting search to reasonable length
    if (sanitizedPlate.length > 20) {
      throw new Error('License plate search term too long.');
    }

    try {
      const { data, error } = await supabase
        .from('cars')
        .select('*')
        .ilike('plate', `%${sanitizedPlate}%`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Supabase error searching car history:', error);
        if (error.code === '42501') {
          throw new Error('Access denied. You do not have permission to search vehicle history.');
        } else {
          throw new Error(`Failed to search vehicle history: ${error.message}`);
        }
      }

      return data && data.length > 0 ? data[0] : null;
    } catch (err) {
      console.error('Error in searchCarHistory:', err);
       if (err instanceof Error) {
        throw err;
      }
      throw new Error('An unknown error occurred while searching vehicle history.');
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
      removeCrew,
      addService,
      updateService,
      deleteService,
      addPackage,
      updatePackage,
      deletePackage,
      searchCarHistory
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
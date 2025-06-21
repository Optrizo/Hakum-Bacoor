import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { CAR_SIZES, Service, ServicePackage, SizePricing } from '../types';

interface AddCarFormProps {
  onComplete: () => void;
}

const AddCarForm: React.FC<AddCarFormProps> = ({ onComplete }) => {
  const { addCar, services, packages } = useQueue();
  const [formData, setFormData] = useState({
    plate: '',
    model: '',
    size: 'medium' as const,
    status: 'waiting' as const,
    phone: '',
    selectedServices: [] as string[],
    selectedPackages: [] as string[],
  });
  const [totalCost, setTotalCost] = useState(0);
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});
  const [packagePrices, setPackagePrices] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isPackagesOpen, setIsPackagesOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCostOverridden, setIsCostOverridden] = useState(false);
  const [manualTotalCost, setManualTotalCost] = useState<number | ''>('');

  useEffect(() => {
    const prices: Record<string, number> = {};
    services.forEach(service => {
      const pricing = service.pricing as SizePricing;
      prices[service.id] = pricing?.[formData.size] || service.price;
    });
    setServicePrices(prices);
  }, [services, formData.size]);

  useEffect(() => {
    const prices: Record<string, number> = {};
    packages.forEach(pkg => {
      prices[pkg.id] = pkg.pricing[formData.size] || 0;
    });
    setPackagePrices(prices);
  }, [packages, formData.size]);

  useEffect(() => {
    const serviceTotal = formData.selectedServices.reduce((sum, serviceId) => {
      return sum + (servicePrices[serviceId] || 0);
    }, 0);

    const packageTotal = formData.selectedPackages.reduce((sum, packageId) => {
      return sum + (packagePrices[packageId] || 0);
    }, 0);
    
    const newTotalCost = serviceTotal + packageTotal;
    setTotalCost(newTotalCost);

    if (!isCostOverridden) {
      setManualTotalCost(newTotalCost);
    }
  }, [formData.selectedServices, formData.selectedPackages, servicePrices, packagePrices, isCostOverridden]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    const plateRegex = /^[A-Z]{3}-?\d{3,4}$/;
    if (!formData.plate.trim()) {
      newErrors.plate = 'License plate is required to identify the vehicle';
    } else if (!plateRegex.test(formData.plate.toUpperCase())) {
      newErrors.plate = 'Please enter a valid Philippine license plate format (e.g., ABC-1234 or ABC1234)';
    }
    
    if (!formData.model.trim()) {
      newErrors.model = 'Car model is required to identify the vehicle type';
    } else if (formData.model.trim().length < 2) {
      newErrors.model = 'Car model must be at least 2 characters long';
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^(09|\+639)\d{9}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid Philippine phone number starting with 09 or +639 followed by 9 digits';
      }
    }

    if (formData.selectedServices.length === 0 && formData.selectedPackages.length === 0) {
      newErrors.services = 'Please select at least one service or package to add the vehicle to the queue';
    }
    if (manualTotalCost !== '' && isNaN(Number(manualTotalCost))) {
      newErrors.total_cost = 'Total cost must be a valid number';
    } else if (manualTotalCost !== '' && Number(manualTotalCost) < 0) {
      newErrors.total_cost = 'Total cost cannot be negative';
    }
    setErrors(newErrors);
    setFormError(Object.keys(newErrors).length > 0 ? 'Please fix the errors below and try again.' : null);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'plate') {
      const cleanValue = value.replace(/[-\s]/g, '').toUpperCase();
      let letters = cleanValue.slice(0, 3).replace(/[^A-Z]/g, '');
      let numbers = cleanValue.slice(3, 7).replace(/[^0-9]/g, '');
      
      if (cleanValue.length > 3) {
        formattedValue = `${letters}-${numbers}`;
      } else {
        formattedValue = letters;
      }
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));

    if (name === 'total_cost') {
        const costValue = value.trim() === '' ? '' : parseFloat(value);
        setManualTotalCost(costValue);
        setIsCostOverridden(value.trim() !== '');
    }
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedServices: prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId]
    }));
  };

  const handlePackageToggle = (packageId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPackages: prev.selectedPackages.includes(packageId)
        ? prev.selectedPackages.filter(id => id !== packageId)
        : [...prev.selectedPackages, packageId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedServiceNames = formData.selectedServices.map(id => {
        const service = services.find(s => s.id === id);
        return service?.name || '';
      });
      const selectedPackageNames = formData.selectedPackages.map(id => {
        const pkg = packages.find(p => p.id === id);
        return pkg?.name || '';
      });
      const allServiceNames = [...selectedServiceNames, ...selectedPackageNames];

      await addCar({
        plate: formData.plate.toUpperCase(),
        model: formData.model,
        size: formData.size,
        status: formData.status,
        phone: formData.phone.trim() ? formData.phone : '',
        crew: [], // Crew will be assigned later
        service: allServiceNames.join(', '),
        services: [...formData.selectedServices, ...formData.selectedPackages],
        total_cost: manualTotalCost !== '' ? Number(manualTotalCost) : totalCost,
      });
      onComplete();
    } catch (error) {
      console.error('Error adding car:', error);
      
      // Handle specific error messages
      if (error instanceof Error) {
        if (error.message.includes('license plate already exists')) {
          setFormError('A vehicle with this license plate is already in the queue. You can add the same vehicle multiple times for returning customers.');
        } else if (error.message.includes('required fields')) {
          setFormError('Please fill in all required fields marked with an asterisk (*).');
        } else if (error.message.includes('Invalid data')) {
          setFormError('Please check your input and try again.');
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
        {formError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold">Please fix the following errors:</p>
                <p className="text-sm mt-1">{formError}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">Add New Vehicle to Queue</h2>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
            Fill in the required information below to add a vehicle to the service queue.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Plate, Model, Size, Phone */}
          <div className="space-y-4">
            <div>
              <label htmlFor="plate" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                License Plate <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="plate"
                name="plate"
                value={formData.plate}
                onChange={handleChange}
                className={`block w-full rounded-md bg-background-light dark:bg-background-dark border shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2 uppercase ${
                  errors.plate 
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                    : 'border-border-light dark:border-border-dark'
                }`}
                placeholder="ABC-1234"
                maxLength={8}
                required
              />
              {errors.plate ? (
                <p className="mt-1 text-xs text-red-500 flex items-start">
                  <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.plate}
                </p>
              ) : (
                <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Enter the vehicle's license plate number (e.g., ABC-1234)
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Car Model <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className={`block w-full rounded-md bg-background-light dark:bg-background-dark border shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2 ${
                  errors.model 
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                    : 'border-border-light dark:border-border-dark'
                }`}
                placeholder="e.g., Toyota Vios"
                required
              />
              {errors.model ? (
                <p className="mt-1 text-xs text-red-500 flex items-start">
                  <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.model}
                </p>
              ) : (
                <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Enter the vehicle's make and model (e.g., Toyota Vios, Honda City)
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Car Size <span className="text-red-500">*</span>
              </label>
              <select
                id="size"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="block w-full rounded-md bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2"
                required
              >
                {CAR_SIZES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Select the vehicle size to determine pricing
              </p>
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`block w-full rounded-md bg-background-light dark:bg-background-dark border shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2 ${
                  errors.phone 
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                    : 'border-border-light dark:border-border-dark'
                }`}
                placeholder="09123456789"
              />
              {errors.phone ? (
                <p className="mt-1 text-xs text-red-500 flex items-start">
                  <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.phone}
                </p>
              ) : (
                <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                  Customer's phone number for notifications (optional)
                </p>
              )}
            </div>
          </div>

          {/* Column 2: Services & Packages */}
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-gray-900/50">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsServicesOpen(!isServicesOpen)}>
                <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                  Select Services <span className="text-red-500">*</span>
                </span>
                <svg className={`w-5 h-5 transition-transform ${isServicesOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              {isServicesOpen && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                      <label htmlFor={`service-${service.id}`} className="flex items-center cursor-pointer flex-grow">
                        <input
                          type="checkbox"
                          id={`service-${service.id}`}
                          checked={formData.selectedServices.includes(service.id)}
                          onChange={() => handleServiceToggle(service.id)}
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-blue focus:ring-brand-blue"
                        />
                        <span className="ml-3 text-sm text-text-primary-light dark:text-text-primary-dark">{service.name}</span>
                      </label>
                      <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">₱{servicePrices[service.id]?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-gray-900/50">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsPackagesOpen(!isPackagesOpen)}>
                <span className="font-medium text-text-primary-light dark:text-text-primary-dark">
                  Select Packages <span className="text-gray-500 text-xs">(Optional)</span>
                </span>
                <svg className={`w-5 h-5 transition-transform ${isPackagesOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
              {isPackagesOpen && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto pr-2">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700">
                      <label htmlFor={`pkg-${pkg.id}`} className="flex items-center cursor-pointer flex-grow">
                        <input
                          type="checkbox"
                          id={`pkg-${pkg.id}`}
                          checked={formData.selectedPackages.includes(pkg.id)}
                          onChange={() => handlePackageToggle(pkg.id)}
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-brand-blue focus:ring-brand-blue"
                        />
                        <span className="ml-3 text-sm text-text-primary-light dark:text-text-primary-dark">{pkg.name}</span>
                      </label>
                      <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">₱{packagePrices[pkg.id]?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {errors.services && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-xs text-red-600 dark:text-red-400 flex items-start">
                  <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.services}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-border-light dark:border-border-dark pt-6 mt-6">
          <div className="flex justify-between items-center">
            <div className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">
              Total Cost
            </div>
            <div className="w-1/3">
              <input
                type="number"
                name="total_cost"
                value={manualTotalCost}
                onChange={handleChange}
                className={`block w-full rounded-md bg-background-light dark:bg-background-dark border shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-lg p-2 text-right font-bold ${
                  errors.total_cost 
                    ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                    : 'border-border-light dark:border-border-dark'
                }`}
                placeholder="Calculated automatically"
                min="0"
                step="0.01"
              />
            </div>
          </div>
          {errors.total_cost ? (
            <p className="mt-1 text-xs text-red-500 text-right flex items-center justify-end">
              <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {errors.total_cost}
            </p>
          ) : (
            <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark text-right">
              Cost is calculated automatically based on selected services and packages
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={onComplete}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-brand-blue hover:bg-brand-dark-blue disabled:opacity-50 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Adding...
              </span>
            ) : (
              'Add to Queue'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddCarForm;
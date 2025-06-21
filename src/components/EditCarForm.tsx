import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { Car, CAR_SIZES, SERVICE_STATUSES, SizePricing } from '../types';

interface EditCarFormProps {
  car: Car;
  onComplete: () => void;
}

const EditCarForm: React.FC<EditCarFormProps> = ({ car, onComplete }) => {
  const { updateCar, services, packages, crews } = useQueue();

  // Helper to initialize selected services and packages from the car's data
  const initialServices = car.services || [];
  const serviceIds = new Set(services.map(s => s.id));
  const packageIds = new Set(packages.map(p => p.id));
  
  const initialSelectedServices = initialServices.filter(id => serviceIds.has(id));
  const initialSelectedPackages = initialServices.filter(id => packageIds.has(id));

  const [formData, setFormData] = useState({
    plate: car.plate,
    model: car.model,
    size: car.size,
    service: car.service,
    status: car.status,
    phone: car.phone || '',
    crew: car.crew || [],
    selectedServices: initialSelectedServices,
    selectedPackages: initialSelectedPackages,
    total_cost: car.total_cost || 0,
  });
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});
  const [packagePrices, setPackagePrices] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isPackagesOpen, setIsPackagesOpen] = useState(false);
  const [isCrewOpen, setIsCrewOpen] = useState(false);
  const [calculatedCost, setCalculatedCost] = useState(0);
  const [isCostOverridden, setIsCostOverridden] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize service prices based on car size
    const prices: Record<string, number> = {};
    services.forEach(service => {
      const pricing = service.pricing as SizePricing;
      prices[service.id] = pricing?.[formData.size as keyof SizePricing] || service.price;
    });
    setServicePrices(prices);
  }, [services, formData.size]);

  useEffect(() => {
    // Initialize package prices based on car size
    const prices: Record<string, number> = {};
    packages.forEach(pkg => {
      prices[pkg.id] = pkg.pricing[formData.size as keyof SizePricing] || 0;
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
    
    const total = serviceTotal + packageTotal;
    setCalculatedCost(total);
    
    if (!isCostOverridden) {
      setFormData(prev => ({ ...prev, total_cost: total }));
    }
  }, [formData.selectedServices, formData.selectedPackages, servicePrices, packagePrices, isCostOverridden]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.plate.trim()) {
      newErrors.plate = 'License plate is required to identify the vehicle';
    } else if (!/^[A-Z]{2,3}[\s-]?\d{3,4}$/.test(formData.plate.toUpperCase())) {
      newErrors.plate = 'Please enter a valid Philippine license plate format (e.g., ABC-1234 or ABC1234)';
      console.log('Plate validation failed for:', formData.plate.toUpperCase());
    }
    
    if (!formData.model.trim()) {
      newErrors.model = 'Car model is required to identify the vehicle type';
    } else if (formData.model.trim().length < 2) {
      newErrors.model = 'Car model must be at least 2 characters long';
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^(\+63|0)[\d\s]{10,12}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid Philippine phone number starting with 09 or +639 followed by 9 digits';
      }
    }
    
    if (Object.keys(newErrors).length > 0) {
      setFormError('Please fix the errors below and try again.');
      console.error('Validation failed:', newErrors);
    } else {
      setFormError(null);
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue: string | number = value;

    if (name === 'total_cost') {
      setIsCostOverridden(true);
      formattedValue = value === '' ? 0 : parseFloat(value);
    } else if (name === 'plate') {
      formattedValue = value.toUpperCase();
    } else if (name === 'phone') {
      formattedValue = value.replace(/[^\d+]/g, '');
      if (formattedValue.startsWith('+63') && formattedValue.length > 3) {
        formattedValue = `+63 ${formattedValue.slice(3).match(/.{1,3}/g)?.join(' ')}`;
      } else if (formattedValue.startsWith('0') && formattedValue.length > 1) {
        formattedValue = `${formattedValue.slice(0, 4)} ${formattedValue.slice(4, 7)} ${formattedValue.slice(7, 11)}`;
      }
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
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

  const handleCrewToggle = (crewId: string) => {
    setFormData(prev => ({
      ...prev,
      crew: prev.crew.includes(crewId)
        ? prev.crew.filter(id => id !== crewId)
        : [...prev.crew, crewId]
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
      const allSelectedServiceIds = [...formData.selectedServices, ...formData.selectedPackages];
      const selectedServices = services.filter(s => formData.selectedServices.includes(s.id));
      const selectedPackages = packages.filter(p => formData.selectedPackages.includes(p.id));
      const allServiceNames = [
        ...selectedServices.map(s => s.name),
        ...selectedPackages.map(p => p.name)
      ];
      await updateCar(car.id, {
        plate: formData.plate,
        model: formData.model,
        size: formData.size,
        status: formData.status,
        phone: formData.phone.trim() ? formData.phone : '',
        crew: formData.crew,
        service: allServiceNames.join(', '),
        services: allSelectedServiceIds,
        total_cost: formData.total_cost,
      });
      onComplete();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An unknown error occurred. Please try again.');
      console.error('Error updating car:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-2">Edit Vehicle Information</h3>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Update the vehicle details below. Required fields are marked with a red asterisk (*).
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-plate" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            License Plate <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="edit-plate"
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
            disabled={isSubmitting}
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
              Vehicle's license plate number
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="edit-model" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Car Model <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="edit-model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className={`block w-full rounded-md bg-background-light dark:bg-background-dark border shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2 ${
              errors.model 
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                : 'border-border-light dark:border-border-dark'
            }`}
            placeholder="e.g., Toyota Vios"
            disabled={isSubmitting}
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
              Vehicle's make and model
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="edit-phone" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <input
            type="tel"
            id="edit-phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            className={`block w-full rounded-md bg-background-light dark:bg-background-dark border shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2 ${
              errors.phone 
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' 
                : 'border-border-light dark:border-border-dark'
            }`}
            placeholder="0912 345 6789"
            disabled={isSubmitting}
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
              Customer's contact number for notifications
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="edit-size" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Car Size <span className="text-red-500">*</span>
          </label>
          <select
            id="edit-size"
            name="size"
            value={formData.size}
            onChange={handleChange}
            className="block w-full rounded-md bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2"
            disabled={isSubmitting}
            required
          >
            {CAR_SIZES.map(size => (
              <option key={size.value} value={size.value}>{size.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Vehicle size affects service pricing
          </p>
        </div>
        
        <div>
          <label htmlFor="edit-status" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Status <span className="text-red-500">*</span>
          </label>
          <select
            id="edit-status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block w-full rounded-md bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2"
            disabled={isSubmitting}
            required
          >
            {SERVICE_STATUSES.map(status => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Current service status of the vehicle
          </p>
        </div>
        </div>

      {/* Service & Package Selection */}
      <div className="pt-4 border-t border-border-light dark:border-border-dark">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark mb-2">
            Services & Packages <span className="text-gray-500 text-xs">(Optional)</span>
          </h4>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Select or modify the services and packages for this vehicle
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-6">
          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Services
            </label>
            <div className="max-h-32 overflow-y-auto pr-2 rounded-md bg-background-light dark:bg-gray-900/50 p-2 border border-border-light dark:border-border-dark">
              {services.map(service => (
                <label key={service.id} className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800">
                  <div>
                          <input
                            type="checkbox"
                            checked={formData.selectedServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                      className="form-checkbox h-4 w-4 text-brand-blue bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark rounded focus:ring-brand-blue"
                          />
                    <span className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">{service.name}</span>
                          </div>
                  <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">₱{servicePrices[service.id] || 0}</span>
                </label>
              ))}
              </div>
          </div>
          {/* Packages */}
          <div>
            <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
              Packages
          </label>
            <div className="max-h-32 overflow-y-auto pr-2 rounded-md bg-background-light dark:bg-gray-900/50 p-2 border border-border-light dark:border-border-dark">
              {packages.map(pkg => (
                 <label key={pkg.id} className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800">
                   <div>
                          <input
                            type="checkbox"
                            checked={formData.selectedPackages.includes(pkg.id)}
                            onChange={() => handlePackageToggle(pkg.id)}
                      className="form-checkbox h-4 w-4 text-brand-blue bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark rounded focus:ring-brand-blue"
                          />
                    <span className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">{pkg.name}</span>
                          </div>
                   <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">₱{packagePrices[pkg.id] || 0}</span>
                 </label>
              ))}
              </div>
          </div>
          </div>
        </div>

      {/* Crew Selection */}
      <div className="pt-4 border-t border-border-light dark:border-border-dark">
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
            Assign Crew <span className="text-gray-500 text-xs">(Optional)</span>
          </label>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Select crew members to assign to this vehicle
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-2 rounded-md bg-background-light dark:bg-gray-900/50 p-2 border border-border-light dark:border-border-dark">
                {crews.map(member => (
            <label key={member.id} className="flex items-center cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800">
                    <input
                      type="checkbox"
                      checked={formData.crew.includes(member.id)}
                onChange={() => handleCrewToggle(member.id)}
                className="form-checkbox h-4 w-4 text-brand-blue bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark rounded focus:ring-brand-blue"
                    />
              <span className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">{member.name}</span>
            </label>
                ))}
        </div>
            </div>

      {/* Total Cost Override */}
      <div className="pt-4 border-t border-border-light dark:border-border-dark">
        <div className="mb-4">
          <label htmlFor="edit-total_cost" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Total Cost <span className="text-gray-500 text-xs">(Manual Override)</span>
          </label>
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
            Automatically calculated cost is ₱{calculatedCost.toLocaleString()}. You can override this amount if needed.
          </p>
        </div>
        
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">₱</span>
          <input
            type="number"
            id="edit-total_cost"
            name="total_cost"
            value={formData.total_cost}
            onChange={handleChange}
            className="block w-full rounded-md bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2 pl-8"
            placeholder="0.00"
            disabled={isSubmitting}
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t border-border-light dark:border-border-dark">
        <button
          type="button"
          onClick={onComplete}
          className="px-4 py-2 border border-border-light dark:border-border-dark text-sm font-medium rounded-md text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-dark-blue transition-colors"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
};

export default EditCarForm;
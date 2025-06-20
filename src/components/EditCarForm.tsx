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
      newErrors.plate = 'License plate is required';
    } else if (!/^[A-Z]{2,3}[\s-]?\d{3,4}$/.test(formData.plate.toUpperCase())) {
      newErrors.plate = 'Please enter a valid Philippine license plate';
      console.log('Plate validation failed for:', formData.plate.toUpperCase());
    }
    
    if (!formData.model.trim()) {
      newErrors.model = 'Car model is required';
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^(\+63|0)[\d\s]{10,12}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid Philippine phone number';
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
    console.log('handleSubmit called. Validating form...');
    
    if (validate()) {
      try {
        console.log('Validation passed. Submitting form with data:', formData);
        setIsSubmitting(true);
        
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
      } catch (error: any) {
        console.error('Error updating car:', error);
        setFormError('Failed to save changes. Please try again or contact support.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2">
          {formError}
        </div>
      )}
      <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-4">Edit Vehicle</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-plate" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            License Plate
          </label>
          <input
            type="text"
            id="edit-plate"
            name="plate"
            value={formData.plate}
            onChange={handleChange}
            className="block w-full rounded-md bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue sm:text-sm p-2 uppercase"
            placeholder="LLL-NNNN"
            maxLength={8}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="edit-model" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Car Model
          </label>
          <input
            type="text"
            id="edit-model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            className="block w-full rounded-md bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue sm:text-sm p-2"
            placeholder="e.g., Toyota Vios"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="edit-phone" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            id="edit-phone"
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
            className="block w-full rounded-md bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue sm:text-sm p-2"
            placeholder="0912 345 6789"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="edit-size" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Car Size
          </label>
          <select
            id="edit-size"
            name="size"
            value={formData.size}
            onChange={handleChange}
            className="block w-full rounded-md bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue sm:text-sm p-2"
            disabled={isSubmitting}
          >
            {CAR_SIZES.map(size => (
              <option key={size.value} value={size.value}>{size.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="edit-status" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
            Status
          </label>
          <select
            id="edit-status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block w-full rounded-md bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue sm:text-sm p-2"
            disabled={isSubmitting}
          >
            {SERVICE_STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Service & Package Selection */}
      <div className="pt-4 border-t border-border-light dark:border-border-dark">
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
        <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
          Assign Crew
        </label>
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
        <label htmlFor="edit-total_cost" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
          Total Cost (Manual Override)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">₱</span>
          <input
            type="number"
            id="edit-total_cost"
            name="total_cost"
            value={formData.total_cost}
            onChange={handleChange}
            className="block w-full rounded-md bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue sm:text-sm p-2 pl-8"
            placeholder="0.00"
            disabled={isSubmitting}
          />
        </div>
        <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
          Automatically calculated cost is ₱{calculatedCost.toLocaleString()}. Editing this field will override it.
        </p>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t border-border-light dark:border-border-dark">
        <button
          type="button"
          onClick={onComplete}
          className="px-4 py-2 border border-border-light dark:border-border-dark text-sm font-medium rounded-md text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-100 dark:hover:bg-gray-700"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-blue hover:bg-brand-dark-blue"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default EditCarForm;
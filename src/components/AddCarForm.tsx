import React, { useState, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import { CAR_SIZES, Service, ServicePackage, SizePricing } from '../types';

interface AddCarFormProps {
  onComplete: () => void;
}

const AddCarForm: React.FC<AddCarFormProps> = ({ onComplete }) => {
  const { addCar, services, packages, crews } = useQueue();
  const [formData, setFormData] = useState({
    plate: '',
    model: '',
    size: 'medium',
    status: 'waiting',
    phone: '',
    selectedServices: [] as string[],
    selectedPackages: [] as string[],
    crew: [] as string[],
  });
  const [totalCost, setTotalCost] = useState(0);
  const [servicePrices, setServicePrices] = useState<Record<string, number>>({});
  const [packagePrices, setPackagePrices] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const [isPackagesOpen, setIsPackagesOpen] = useState(false);
  const [isCrewOpen, setIsCrewOpen] = useState(false);
  const [serviceType, setServiceType] = useState<'service' | 'package'>('service');
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isCostOverridden, setIsCostOverridden] = useState(false);
  const [manualTotalCost, setManualTotalCost] = useState<number | ''>('');

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
    calculateTotalCost();
    if (!isCostOverridden) {
      setManualTotalCost(totalCost);
    }
  }, [formData.selectedServices, formData.selectedPackages, servicePrices, packagePrices, totalCost, isCostOverridden]);

  const calculateTotalCost = () => {
    const serviceTotal = formData.selectedServices.reduce((sum, serviceId) => {
      return sum + (servicePrices[serviceId] || 0);
    }, 0);
    
    const packageTotal = formData.selectedPackages.reduce((sum, packageId) => {
      return sum + (packagePrices[packageId] || 0);
    }, 0);
    
    setTotalCost(serviceTotal + packageTotal);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    const plateRegex = /^[A-Z]{3}-?\d{4}$/;
    if (!formData.plate.trim()) {
      newErrors.plate = 'License plate is required';
    } else if (!plateRegex.test(formData.plate.toUpperCase())) {
      newErrors.plate = 'Please enter a valid Philippine license plate (e.g., ABC-1234)';
    }
    
    if (!formData.model.trim()) {
      newErrors.model = 'Car model is required';
    }

    if (formData.phone.trim()) {
      const phoneRegex = /^(\+63|0)[\d\s]{10,12}$/;
      if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
        newErrors.phone = 'Please enter a valid Philippine phone number (e.g., +63 912 345 6789 or 0912 345 6789)';
      }
    }

    if (formData.selectedServices.length === 0 && formData.selectedPackages.length === 0) {
      newErrors.services = 'Please select at least one service or package';
    }
    if (manualTotalCost !== '' && isNaN(Number(manualTotalCost))) {
      newErrors.total_cost = 'Total cost must be a number';
    }
    setErrors(newErrors);
    setFormError(Object.keys(newErrors).length > 0 ? 'Please fix the errors below and try again.' : null);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'plate') {
      // Remove any existing dashes and spaces
      const cleanValue = value.replace(/[-\s]/g, '').toUpperCase();
      
      // Enforce Philippine format: 3 letters + 4 numbers
      let letters = cleanValue.slice(0, 3).replace(/[^A-Z]/g, '');
      let numbers = cleanValue.slice(3, 7).replace(/[^0-9]/g, '');
      
      // Combine with dash
      if (letters.length >= 3 && numbers.length > 0) {
        formattedValue = letters + '-' + numbers;
      } else if (letters.length > 0) {
        formattedValue = letters + (numbers.length > 0 ? '-' + numbers : '');
      } else {
        formattedValue = cleanValue;
      }
    }

    if (name === 'phone') {
      formattedValue = value.replace(/[^\d+]/g, '');
      if (formattedValue.startsWith('+63') && formattedValue.length > 3) {
        formattedValue = `+63 ${formattedValue.slice(3).match(/.{1,3}/g)?.join(' ')}`;
      } else if (formattedValue.startsWith('0') && formattedValue.length > 1) {
        formattedValue = `${formattedValue.slice(0, 4)} ${formattedValue.slice(4, 7)} ${formattedValue.slice(7, 11)}`;
      }
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    if (name === 'total_cost') {
      setIsCostOverridden(true);
      setManualTotalCost(value === '' ? '' : parseFloat(value));
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

  const handleCrewToggle = (crewId: string) => {
    setFormData(prev => ({
      ...prev,
      crew: prev.crew.includes(crewId)
        ? prev.crew.filter(id => id !== crewId)
        : [...prev.crew, crewId]
    }));
  };

  const handleServiceTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServiceType(e.target.value as 'service' | 'package');
  };

  const handleServiceSelect = (id: string, name: string) => {
    setSelectedServiceId(id);
    if (serviceType === 'service') {
      handleServiceToggle(id);
    } else {
      handlePackageToggle(id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (validate()) {
      try {
        setIsSubmitting(true);
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
          plate: formData.plate,
          model: formData.model,
          size: formData.size,
          status: formData.status,
          phone: formData.phone.trim() ? formData.phone : '',
          crew: formData.crew,
          service: allServiceNames.join(', '),
          services: [...formData.selectedServices, ...formData.selectedPackages],
          total_cost: manualTotalCost !== '' ? Number(manualTotalCost) : totalCost,
        });
        onComplete();
      } catch (error) {
        setFormError('Failed to add vehicle. Please try again or contact support.');
        console.error('Error adding car:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-surface-light dark:bg-surface-dark p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark">
        {formError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-2">
            {formError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1: Plate, Model, Size */}
          <div className="space-y-6">
            <div>
              <label htmlFor="plate" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                License Plate
              </label>
              <input
                type="text"
                id="plate"
                name="plate"
                value={formData.plate}
                onChange={handleChange}
                className="block w-full rounded-md bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue sm:text-sm p-3 uppercase"
                placeholder="LLL-NNNN"
              />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Car Model
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                className="block w-full rounded-md bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue sm:text-sm p-3"
                placeholder="e.g., Toyota Vios"
              />
            </div>
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Car Size
              </label>
              <select
                id="size"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="block w-full rounded-md bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue sm:text-sm p-3"
              >
                {CAR_SIZES.map(size => (
                  <option key={size.value} value={size.value}>
                    {size.label}
                  </option>
                ))}
              </select>
            </div>
             <div>
              <label htmlFor="phone" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="block w-full rounded-md bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue sm:text-sm p-3"
                placeholder="0912 345 6789"
              />
            </div>
            <div>
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
          </div>

          {/* Column 2: Service/Package Selection */}
          <div className="space-y-6">
            <div>
              <fieldset>
                <legend className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">Service Type</legend>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input type="radio" name="serviceOrPackage" value="service" checked={serviceType === 'service'} onChange={handleServiceTypeChange} className="form-radio h-4 w-4 text-brand-blue bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark focus:ring-brand-blue" />
                    <span className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">Service</span>
                  </label>
                  <label className="flex items-center">
                    <input type="radio" name="serviceOrPackage" value="package" checked={serviceType === 'package'} onChange={handleServiceTypeChange} className="form-radio h-4 w-4 text-brand-blue bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark focus:ring-brand-blue" />
                    <span className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">Package</span>
                  </label>
                </div>
              </fieldset>
            </div>
            
            <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
              <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1 capitalize">
                {serviceType}s
              </label>
              {
                (serviceType === 'service' ? services : packages).map(item => {
                  const isSelected = serviceType === 'service'
                    ? formData.selectedServices.includes(item.id)
                    : formData.selectedPackages.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors flex justify-between items-center ${isSelected ? 'bg-brand-blue/10 border-brand-blue ring-2 ring-brand-blue' : 'bg-background-light dark:bg-gray-800/50 border-border-light dark:border-border-dark hover:border-gray-400 dark:hover:border-gray-500'}`}
                      onClick={() => handleServiceSelect(item.id, item.name)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary-light dark:text-text-primary-dark">{item.name}</span>
                        {isSelected && (
                          <span className="text-green-600 text-lg font-bold ml-2">✓</span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-green-500">
                        ₱{item.pricing[formData.size] || 'N/A'}
                      </span>
                    </div>
                  );
                })
              }
            </div>
            <div className="pt-4 border-t border-border-light dark:border-border-dark">
              <label htmlFor="add-total_cost" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                Total Cost (Manual Override)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-secondary-light dark:text-text-secondary-dark">₱</span>
                <input
                  type="number"
                  id="add-total_cost"
                  name="total_cost"
                  value={manualTotalCost}
                  onChange={handleChange}
                  className="block w-full rounded-md bg-background-light dark:bg-background-dark border-border-light dark:border-border-dark shadow-sm focus:border-brand-blue focus:ring-brand-blue sm:text-sm p-2 pl-8"
                  placeholder="0.00"
                  disabled={isSubmitting}
                />
              </div>
              <p className="mt-1 text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Automatically calculated cost is ₱{totalCost.toLocaleString()}. Editing this field will override it.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border-light dark:border-border-dark pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Total</p>
              <p className="text-3xl font-bold text-brand-blue">
                ₱{totalCost.toLocaleString()}
              </p>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-blue hover:bg-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark focus:ring-brand-blue"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add to Queue'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddCarForm;
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
  }, [formData.selectedServices, formData.selectedPackages, servicePrices, packagePrices]);

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
    
    const plateRegex = /^[A-Z]{2,3}[\s-]?\d{3,4}$/;
    if (!formData.plate.trim()) {
      newErrors.plate = 'License plate is required';
    } else if (!plateRegex.test(formData.plate.toUpperCase())) {
      newErrors.plate = 'Please enter a valid Philippine license plate (e.g., ABC 1234, ABC-1234)';
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'plate') {
      formattedValue = value.toUpperCase();
      if (value.length === 3) {
        formattedValue += '-';
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
          phone: formData.phone || 'Not provided',
          crew: formData.crew,
          service: allServiceNames.join(', '),
          services: [...formData.selectedServices, ...formData.selectedPackages],
          total_cost: totalCost,
        });
        onComplete();
      } catch (error) {
        console.error('Error adding car:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold text-white">Add New Vehicle</h2>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="plate" className="block text-sm font-medium text-gray-300 mb-1">
            License Plate *
          </label>
          <input
            type="text"
            id="plate"
            name="plate"
            value={formData.plate}
            onChange={handleChange}
            placeholder="e.g., ABC-1234"
            className={`block w-full rounded-md shadow-sm sm:text-sm p-2 bg-gray-900 border ${
              errors.plate ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-700 focus:ring-blue-500 focus:border-blue-500'
            } text-white placeholder-gray-400`}
            disabled={isSubmitting}
            maxLength={8}
          />
          {errors.plate && <p className="mt-1 text-sm text-red-400">{errors.plate}</p>}
        </div>

        <div>
          <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-1">
            Car Model *
          </label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model}
            onChange={handleChange}
            placeholder="e.g., Toyota Vios"
            className={`block w-full rounded-md shadow-sm sm:text-sm p-2 bg-gray-900 border ${
              errors.model ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-700 focus:ring-blue-500 focus:border-blue-500'
            } text-white placeholder-gray-400`}
            disabled={isSubmitting}
          />
          {errors.model && <p className="mt-1 text-sm text-red-400">{errors.model}</p>}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
            Phone Number <span className="text-gray-500">(optional)</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="e.g., 0912 345 6789"
            className={`block w-full rounded-md shadow-sm sm:text-sm p-2 bg-gray-900 border ${
              errors.phone ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-700 focus:ring-blue-500 focus:border-blue-500'
            } text-white placeholder-gray-400`}
            disabled={isSubmitting}
            maxLength={13}
          />
          {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="size" className="block text-sm font-medium text-gray-300 mb-1">
            Car Size
          </label>
          <select
            id="size"
            name="size"
            value={formData.size}
            onChange={handleChange}
            className="block w-full rounded-md shadow-sm sm:text-sm p-2 bg-gray-900 border border-gray-700 text-white focus:ring-blue-500 focus:border-blue-500"
            disabled={isSubmitting}
          >
            {CAR_SIZES.map(size => (
              <option key={size.value} value={size.value}>
                {size.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Services *
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsServicesOpen(!isServicesOpen)}
              className={`w-full text-left p-2 bg-gray-900 border ${
                errors.services ? 'border-red-500' : 'border-gray-700'
              } rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {formData.selectedServices.length === 0 ? (
                <span className="text-gray-400">Select services...</span>
              ) : (
                <span>{formData.selectedServices.length} services selected</span>
              )}
            </button>
            
            {isServicesOpen && (
              <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                {services.map(service => {
                  const pricing = service.pricing as SizePricing;
                  const price = pricing?.[formData.size as keyof SizePricing] || service.price;
                  return (
                    <div
                      key={service.id}
                      className="p-2 hover:bg-gray-800 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.selectedServices.includes(service.id)}
                            onChange={() => handleServiceToggle(service.id)}
                            className="h-4 w-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
                          />
                          <div className="ml-2">
                            <span className="text-white">{service.name}</span>
                            <div className="text-sm text-gray-400">₱{price.toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Service Packages
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPackagesOpen(!isPackagesOpen)}
              className="w-full text-left p-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {formData.selectedPackages.length === 0 ? (
                <span className="text-gray-400">Select packages...</span>
              ) : (
                <span>{formData.selectedPackages.length} packages selected</span>
              )}
            </button>
            
            {isPackagesOpen && (
              <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                {packages.map(pkg => {
                  const price = pkg.pricing[formData.size as keyof SizePricing];
                  return (
                    <div
                      key={pkg.id}
                      className="p-2 hover:bg-gray-800 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.selectedPackages.includes(pkg.id)}
                            onChange={() => handlePackageToggle(pkg.id)}
                            className="h-4 w-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
                          />
                          <div className="ml-2">
                            <span className="text-white">{pkg.name}</span>
                            <div className="text-sm text-gray-400">₱{price.toLocaleString()}</div>
                            {pkg.description && (
                              <div className="text-xs text-gray-500">{pkg.description}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Assign Crew <span className="text-gray-500">(optional)</span>
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCrewOpen(!isCrewOpen)}
              className="w-full text-left p-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {formData.crew.length === 0 ? (
                <span className="text-gray-400">Select crew members...</span>
              ) : (
                <span>{formData.crew.length} crew members selected</span>
              )}
            </button>
            
            {isCrewOpen && (
              <div className="absolute z-10 w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
                {crews.map(member => (
                  <div
                    key={member.id}
                    className="p-2 hover:bg-gray-800 cursor-pointer flex items-center"
                    onClick={() => handleCrewToggle(member.id)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.crew.includes(member.id)}
                      onChange={() => {}}
                      className="h-4 w-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-white">{member.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-gray-300">Selected Items:</span>
            </div>
            <div className="mt-2 space-y-2">
              {formData.selectedServices.map(serviceId => {
                const service = services.find(s => s.id === serviceId);
                const pricing = service?.pricing as SizePricing;
                const price = pricing?.[formData.size as keyof SizePricing] || service?.price || 0;
                return service ? (
                  <div key={service.id} className="flex justify-between text-sm">
                    <span className="text-gray-400">{service.name}</span>
                    <span className="text-white">₱{price.toLocaleString()}</span>
                  </div>
                ) : null;
              })}
              {formData.selectedPackages.map(packageId => {
                const pkg = packages.find(p => p.id === packageId);
                const price = pkg?.pricing[formData.size as keyof SizePricing] || 0;
                return pkg ? (
                  <div key={pkg.id} className="flex justify-between text-sm">
                    <span className="text-gray-400">{pkg.name} (Package)</span>
                    <span className="text-white">₱{price.toLocaleString()}</span>
                  </div>
                ) : null;
              })}
              <div className="pt-2 border-t border-gray-700 flex justify-between items-center">
                <span className="text-lg font-medium text-gray-300">Total:</span>
                <span className="text-2xl font-bold text-blue-500">₱{totalCost.toLocaleString()}</span>
              </div>
            </div>
          </div>
          {errors.services && <p className="mt-1 text-sm text-red-400">{errors.services}</p>}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onComplete}
          className="inline-flex items-center px-4 py-2 border border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Vehicle'}
        </button>
      </div>
    </form>
  );
};

export default AddCarForm;
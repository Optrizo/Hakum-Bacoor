import React, { useState, useRef } from 'react';
import { useQueue } from '../context/QueueContext';
import { Service, ServicePackage, SizePricing, CAR_SIZES } from '../types';
import { Plus, Edit2, Trash2, Package, Wrench } from 'lucide-react';

const ServicesPage: React.FC = () => {  const { 
    services, 
    packages, 
    addService, 
    updateService, 
    deleteService, 
    addPackage, 
    updatePackage, 
    deletePackage
  } = useQueue();
  
  const [activeTab, setActiveTab] = useState<'services' | 'packages'>('services');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  
  // Local form state - completely isolated from real-time updates
  const serviceFormStateRef = useRef({ name: '', description: '', pricing: { small: 0, medium: 0, large: 0, extra_large: 0 } });
  const [serviceFormData, setServiceFormData] = useState({ name: '', description: '', pricing: { small: 0, medium: 0, large: 0, extra_large: 0 } });
  const setServiceFormDataPersist = (data: typeof serviceFormData) => {
    serviceFormStateRef.current = data;
    setServiceFormData(data);
  };
  const packageFormStateRef = useRef({ name: '', description: '', service_ids: [], pricing: { small: 0, medium: 0, large: 0, extra_large: 0 } });
  const [packageFormData, setPackageFormData] = useState({ name: '', description: '', service_ids: [], pricing: { small: 0, medium: 0, large: 0, extra_large: 0 } });
  const setPackageFormDataPersist = (data: typeof packageFormData) => {
    packageFormStateRef.current = data;
    setPackageFormData(data);
  };

  const resetServiceForm = () => {
    setServiceFormData({
      name: '',
      description: '',
      pricing: { small: 0, medium: 0, large: 0, extra_large: 0 }
    });
    setEditingService(null);
    setShowAddForm(false);
  };

  const resetPackageForm = () => {
    setPackageFormData({
      name: '',
      description: '',
      service_ids: [],
      pricing: { small: 0, medium: 0, large: 0, extra_large: 0 }
    });
    setEditingPackage(null);
    setShowAddForm(false);
  };

  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!serviceFormData.name.trim()) {
      alert('Service name is required');
      return;
    }

    try {
      const serviceData = {
        name: serviceFormData.name.trim(),
        description: serviceFormData.description.trim() || null,
        price: serviceFormData.pricing.medium, // Use medium as base price
        pricing: serviceFormData.pricing,
      };

      if (editingService) {
        await updateService(editingService.id, serviceData);
      } else {
        await addService(serviceData);
      }
      
      resetServiceForm();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service. Please try again.');
    }
  };

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!packageFormData.name.trim()) {
      alert('Package name is required');
      return;
    }

    if (packageFormData.service_ids.length === 0) {
      alert('Please select at least one service for the package');
      return;
    }

    try {
      const packageData = {
        name: packageFormData.name.trim(),
        description: packageFormData.description.trim() || null,
        service_ids: packageFormData.service_ids,
        pricing: packageFormData.pricing,
        is_active: true,
      };

      if (editingPackage) {
        await updatePackage(editingPackage.id, packageData);
      } else {
        await addPackage(packageData);
      }
      
      resetPackageForm();
    } catch (error) {
      console.error('Error saving package:', error);
      alert('Failed to save package. Please try again.');
    }
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setServiceFormData({
      name: service.name,
      description: service.description || '',
      pricing: service.pricing || { small: 0, medium: 0, large: 0, extra_large: 0 },
    });
    setActiveTab('services');
    setShowAddForm(false);
  };

  const handleEditPackage = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setPackageFormData({
      name: pkg.name,
      description: pkg.description || '',
      service_ids: pkg.service_ids || [],
      pricing: pkg.pricing || { small: 0, medium: 0, large: 0, extra_large: 0 },
    });
    setActiveTab('packages');
    setShowAddForm(false);
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteService(id);
      } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service. Please try again.');
      }
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        await deletePackage(id);
      } catch (error) {
        console.error('Error deleting package:', error);
        alert('Failed to delete package. Please try again.');
      }
    }
  };

  const handleServicePricingChange = (size: keyof SizePricing, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    setServiceFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [size]: numValue
      }
    }));
  };

  const handlePackagePricingChange = (size: keyof SizePricing, e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    setPackageFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [size]: numValue
      }
    }));
  };
  const handleServiceToggle = (serviceId: string) => {
    setPackageFormData(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId]
    }));
  };

  const ServiceForm = React.useMemo(() => (
    <form onSubmit={handleServiceSubmit} className="bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-800 mb-6">
      <h3 className="text-lg font-medium text-white mb-4">
        {editingService ? 'Edit Service' : 'Add New Service'}
      </h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="service-name" className="block text-sm font-medium text-gray-300 mb-1">
            Service Name *
          </label>
          <input
            type="text"
            id="service-name"
            value={serviceFormData.name}
            onChange={(e) => setServiceFormDataPersist({ ...serviceFormData, name: e.target.value })}
            className="block w-full rounded-md bg-gray-800 border border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white p-3"
            placeholder="Enter service name"
            required
            autoComplete="off"
          />
        </div>
        
        <div>
          <label htmlFor="service-description" className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="service-description"
            value={serviceFormData.description}
            onChange={(e) => setServiceFormDataPersist({ ...serviceFormData, description: e.target.value })}
            className="block w-full rounded-md bg-gray-800 border border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white p-3"
            rows={3}
            placeholder="Enter service description"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Pricing by Car Size *
          </label>
          <div className="grid grid-cols-2 gap-4">
            {CAR_SIZES.map(size => (
              <div key={size.value}>
                <label className="block text-xs text-gray-400 mb-1">{size.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₱</span>
                  <input
                    type="number"
                    value={serviceFormData.pricing[size.value] || ''}
                    onChange={(e) => handleServicePricingChange(size.value, e)}
                    className="block w-full pl-8 pr-3 py-2 rounded-md bg-gray-800 border border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    autoComplete="off"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-2">
        <button
          type="button"
          onClick={resetServiceForm}
          className="inline-flex items-center px-4 py-2 border border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {editingService ? 'Update Service' : 'Add Service'}
        </button>
      </div>
    </form>
  ), [serviceFormData, editingService]);

  const PackageForm = React.useMemo(() => (
    <form onSubmit={handlePackageSubmit} className="bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-800 mb-6">
      <h3 className="text-lg font-medium text-white mb-4">
        {editingPackage ? 'Edit Package' : 'Add New Package'}
      </h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="package-name" className="block text-sm font-medium text-gray-300 mb-1">
            Package Name *
          </label>
          <input
            type="text"
            id="package-name"
            value={packageFormData.name}
            onChange={(e) => setPackageFormDataPersist({ ...packageFormData, name: e.target.value })}
            className="block w-full rounded-md bg-gray-800 border border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white p-3"
            placeholder="e.g., Platinum Package"
            required
            autoComplete="off"
          />
        </div>
        
        <div>
          <label htmlFor="package-description" className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            id="package-description"
            value={packageFormData.description}
            onChange={(e) => setPackageFormDataPersist({ ...packageFormData, description: e.target.value })}
            className="block w-full rounded-md bg-gray-800 border border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white p-3"
            rows={3}
            placeholder="Enter package description"
            autoComplete="off"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Included Services *
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-700 rounded-md p-3 bg-gray-800">            {services.length === 0 ? (
              <p className="text-gray-400 text-sm">No services available. Please add services first.</p>
            ) : (
              services.map(service => (
                <label key={service.id} className="flex items-center cursor-pointer hover:bg-gray-700 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={packageFormData.service_ids.includes(service.id)}
                    onChange={() => handleServiceToggle(service.id)}
                    className="form-checkbox h-4 w-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-white">{service.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Package Pricing by Car Size *
          </label>
          <div className="grid grid-cols-2 gap-4">
            {CAR_SIZES.map(size => (
              <div key={size.value}>
                <label className="block text-xs text-gray-400 mb-1">{size.label}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">₱</span>
                  <input
                    type="number"
                    value={packageFormData.pricing[size.value] || ''}
                    onChange={(e) => handlePackagePricingChange(size.value, e)}
                    className="block w-full pl-8 pr-3 py-2 rounded-md bg-gray-800 border border-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    autoComplete="off"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-2">
        <button
          type="button"
          onClick={resetPackageForm}
          className="inline-flex items-center px-4 py-2 border border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          {editingPackage ? 'Update Package' : 'Add Package'}
        </button>
      </div>
    </form>
  ), [packageFormData, editingPackage]);

  return (
    <div className="space-y-6">      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Services & Packages</h1>
          <p className="text-gray-400">Manage services and service packages</p>
        </div>
        {!showAddForm && !editingService && !editingPackage && (
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add {activeTab === 'services' ? 'Service' : 'Package'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              setActiveTab('services');
              resetServiceForm();
              resetPackageForm();
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'services'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <Wrench className="h-4 w-4 inline mr-2" />
            Services ({services.length})
          </button>
          <button
            onClick={() => {
              setActiveTab('packages');
              resetServiceForm();
              resetPackageForm();
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'packages'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" />
            Packages ({packages.length})
          </button>
        </nav>
      </div>

      {/* Forms */}
      {showAddForm && activeTab === 'services' && ServiceForm}
      {showAddForm && activeTab === 'packages' && PackageForm}
      {editingService && ServiceForm}
      {editingPackage && PackageForm}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md border border-gray-800">
          <ul className="divide-y divide-gray-800">
            {services.map((service) => (
              <li key={service.id} className="px-6 py-4 hover:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white">{service.name}</h3>
                    {service.description && (
                      <p className="text-sm text-gray-400 mt-1">{service.description}</p>
                    )}
                    <div className="mt-2 grid grid-cols-4 gap-4">
                      {CAR_SIZES.map(size => {
                        const pricing = service.pricing as SizePricing;
                        const price = pricing?.[size.value] || 0;
                        return (
                          <div key={size.value} className="text-sm">
                            <span className="text-gray-400">{size.label}:</span>
                            <span className="text-blue-400 font-semibold ml-1">
                              ₱{price.toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditService(service)}
                      className="inline-flex items-center p-2 border border-gray-700 rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="inline-flex items-center p-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {services.length === 0 && (
              <li className="px-6 py-8 text-center">
                <p className="text-gray-400">No services found. Add your first service to get started.</p>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Packages Tab */}
      {activeTab === 'packages' && (
        <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md border border-gray-800">
          <ul className="divide-y divide-gray-800">
            {packages.map((pkg) => (
              <li key={pkg.id} className="px-6 py-4 hover:bg-gray-800">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-white">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="text-sm text-gray-400 mt-1">{pkg.description}</p>
                    )}
                    <div className="mt-2">
                      <p className="text-sm text-gray-400 mb-1">Included Services:</p>
                      <div className="flex flex-wrap gap-1">
                        {pkg.service_ids?.map(serviceId => {
                          const service = services.find(s => s.id === serviceId);
                          return service ? (
                            <span key={serviceId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-600/20 text-blue-400 border border-blue-600/30">
                              {service.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-4 gap-4">
                      {CAR_SIZES.map(size => (
                        <div key={size.value} className="text-sm">
                          <span className="text-gray-400">{size.label}:</span>
                          <span className="text-green-400 font-semibold ml-1">
                            ₱{(pkg.pricing?.[size.value] || 0).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditPackage(pkg)}
                      className="inline-flex items-center p-2 border border-gray-700 rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="inline-flex items-center p-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
            {packages.length === 0 && (
              <li className="px-6 py-8 text-center">
                <p className="text-gray-400">No packages found. Add your first package to get started.</p>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
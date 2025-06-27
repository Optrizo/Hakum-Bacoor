import React, { useState, useEffect, useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import { ServicePackage, Service, MotorcycleSizePricing } from '../types';
import { Box, Edit2, Trash2 } from 'lucide-react';

const emptyPackage: Omit<ServicePackage, 'id' | 'created_at' | 'updated_at' | 'is_active' | 'pricing'> & { pricing: MotorcycleSizePricing } = {
  name: '',
  description: '',
  service_ids: [],
  pricing: { small: 0, large: 0 },
  vehicle_type: 'motorcycle',
};

const MotorcyclePackagesPage: React.FC = () => {
  const { packages, services, addPackage, updatePackage, deletePackage } = useQueue();
  const [showForm, setShowForm] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [formData, setFormData] = useState(emptyPackage);
  const [formError, setFormError] = useState('');

  const motorcycleServices = useMemo(() => services.filter(s => s.vehicle_type === 'motorcycle'), [services]);
  const motorcyclePackages = useMemo(() => packages.filter(p => p.vehicle_type === 'motorcycle'), [packages]);

  useEffect(() => {
    if (editingPackage) {
      setFormData({
        name: editingPackage.name,
        description: editingPackage.description || '',
        service_ids: editingPackage.service_ids,
        pricing: {
          small: (editingPackage.pricing as MotorcycleSizePricing)?.small || 0,
          large: (editingPackage.pricing as MotorcycleSizePricing)?.large || 0,
        },
        vehicle_type: 'motorcycle',
      });
      setShowForm(true);
    } else {
      setFormData(emptyPackage);
    }
  }, [editingPackage]);

  const handleAddClick = () => {
    setEditingPackage(null);
    setFormData(emptyPackage);
    setShowForm(true);
    setFormError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPackage(null);
    setFormData(emptyPackage);
    setFormError('');
  };

  const handleEditClick = (pkg: ServicePackage) => {
    setEditingPackage(pkg);
    setFormError('');
  };

  const handleDeleteClick = async (pkg: ServicePackage) => {
    if (window.confirm(`Are you sure you want to delete "${pkg.name}"? This action cannot be undone.`)) {
      try {
        await deletePackage(pkg.id);
        if (editingPackage?.id === pkg.id) {
          handleCancel();
        }
      } catch (error) {
        console.error('Failed to delete package:', error);
        alert(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
      }
    }
  };

  const handlePricingChange = (size: 'small' | 'large', value: number) => {
    const price = !isNaN(value) && value >= 0 ? value : 0;
    setFormData(prev => ({ ...prev, pricing: { ...prev.pricing, [size]: price } }));
  };
  
  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => {
      const service_ids = prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId];
      return { ...prev, service_ids };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Package name is required.');
      return;
    }
    if (formData.service_ids.length === 0) {
      setFormError('At least one service must be selected for the package.');
      return;
    }
    if (formData.pricing.small <= 0 && formData.pricing.large <= 0) {
      setFormError('At least one price (Small or Large) must be greater than zero.');
      return;
    }

    try {
      const packageData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        is_active: true,
      };

      if (editingPackage) {
        await updatePackage(editingPackage.id, packageData);
      } else {
        await addPackage(packageData);
      }
      handleCancel();
    } catch (error) {
      console.error('Failed to save package', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setFormError(`Failed to save package: ${message}`);
    }
  };
  
  const getServiceName = (serviceId: string) => motorcycleServices.find(s => s.id === serviceId)?.name || 'Unknown Service';

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">Motorcycle Packages</h1>
            <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Bundle motorcycle services into convenient packages.
            </p>
          </div>
          {!showForm && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleAddClick}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-brand-blue hover:bg-brand-dark-blue transition-all duration-200"
              >
                <Box className="h-4 w-4 mr-2" />
                Add Package
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <div className="bg-surface-light dark:bg-surface-dark p-4 sm:p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                {editingPackage ? 'Edit Package' : 'Add New Package'}
              </h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                {editingPackage ? 'Update the details for this motorcycle package.' : 'Create a new package for motorcycles.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({...prev, name: e.target.value}))}
                  className="block w-full rounded-lg bg-background-light dark:bg-background-dark border shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2.5"
                  placeholder="e.g., Full Tune-Up"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Description <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(prev => ({...prev, description: e.target.value}))}
                  rows={3}
                  className="block w-full rounded-lg bg-background-light dark:bg-background-dark border shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2.5"
                  placeholder="Briefly describe the package..."
                />
              </div>
              
              <div>
                <label htmlFor="price-small" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Small Size Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark sm:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    id="price-small"
                    value={formData.pricing.small}
                    onChange={e => handlePricingChange('small', e.target.valueAsNumber)}
                    className="block w-full rounded-lg bg-background-light dark:bg-background-dark border shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2.5 pl-7"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="price-large" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Large Size Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-text-secondary-light dark:text-text-secondary-dark sm:text-sm">₱</span>
                  </div>
                  <input
                    type="number"
                    id="price-large"
                    value={formData.pricing.large}
                    onChange={e => handlePricingChange('large', e.target.valueAsNumber)}
                    className="block w-full rounded-lg bg-background-light dark:bg-background-dark border shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2.5 pl-7"
                    min="0"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-2">
                  Included Services <span className="text-red-500">*</span>
                </label>
                <div className="max-h-40 overflow-y-auto pr-2 rounded-md bg-background-light dark:bg-gray-900/50 p-2 border border-border-light dark:border-border-dark">
                  {motorcycleServices.length > 0 ? motorcycleServices.map(service => (
                    <label key={service.id} className="flex items-center cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800">
                      <input
                        type="checkbox"
                        checked={formData.service_ids.includes(service.id)}
                        onChange={() => handleServiceToggle(service.id)}
                        className="form-checkbox h-4 w-4 text-brand-blue bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark rounded focus:ring-brand-blue"
                      />
                      <span className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">{service.name}</span>
                    </label>
                  )) : (
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark text-center py-4">No motorcycle services available to add to a package.</p>
                  )}
                </div>
              </div>

              {formError && <p className="md:col-span-2 mt-2 text-sm text-red-500">{formError}</p>}
              
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark bg-surface-light dark:bg-surface-dark border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-lg hover:bg-brand-dark-blue">{editingPackage ? 'Save Changes' : 'Create Package'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-surface-light dark:bg-surface-dark shadow overflow-hidden rounded-lg border border-border-light dark:border-border-dark">
          <ul className="divide-y divide-border-light dark:divide-border-dark">
            {motorcyclePackages.length > 0 ? motorcyclePackages.map(pkg => (
              <li key={pkg.id} className="p-4 sm:p-6 hover:bg-background-light dark:hover:bg-background-dark transition-colors duration-200">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark truncate">{pkg.name}</h4>
                    <div className="mt-2">
                        <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">Included Services</p>
                        <div className="flex flex-wrap gap-1">
                            {pkg.service_ids.map(id => (
                                <span key={id} className="inline-block bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30 rounded-full px-2 py-0.5 text-xs font-semibold dark:bg-brand-cyan/20 dark:text-brand-cyan">
                                    {getServiceName(id)}
                                </span>
                            ))}
                        </div>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-4 mt-4 sm:mt-0 sm:ml-6 flex-shrink-0">
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Small</span>
                      <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                        ₱{(pkg.pricing as MotorcycleSizePricing)?.small ?? 'N/A'}
                      </span>
                    </div>
                     <div className="flex flex-col text-right">
                      <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Large</span>
                      <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                        ₱{(pkg.pricing as MotorcycleSizePricing)?.large ?? 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(pkg)}
                        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Edit Package"
                      >
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(pkg)}
                        className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        title="Delete Package"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            )) : (
              <div className="text-center py-12 px-6">
                <Box className="mx-auto h-12 w-12 text-text-secondary-light dark:text-text-secondary-dark opacity-50" />
                <h3 className="mt-2 text-base font-medium text-text-primary-light dark:text-text-primary-dark">No motorcycle packages found</h3>
                <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Get started by adding your first package for motorcycles.
                </p>
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MotorcyclePackagesPage; 
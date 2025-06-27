import React, { useState, useEffect, useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import { Service, MotorcycleSizePricing } from '../types';
import { Wrench, Edit2, Trash2 } from 'lucide-react';

const emptyService: Omit<Service, 'id' | 'created_at' | 'updated_at' | 'price' | 'pricing'> & { pricing: MotorcycleSizePricing } = {
  name: '',
  description: '',
  pricing: { small: 0, large: 0 },
  vehicle_type: 'motorcycle',
};

const MotorcycleServicesPage: React.FC = () => {
  const { services, addService, updateService, deleteService } = useQueue();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState(emptyService);
  const [formError, setFormError] = useState('');

  const motorcycleServices = useMemo(() => services.filter(s => s.vehicle_type === 'motorcycle'), [services]);

  useEffect(() => {
    if (editingService) {
      setFormData({
        name: editingService.name,
        description: editingService.description || '',
        pricing: {
          small: (editingService.pricing as MotorcycleSizePricing)?.small || 0,
          large: (editingService.pricing as MotorcycleSizePricing)?.large || 0,
        },
        vehicle_type: 'motorcycle',
      });
      setShowForm(true);
    } else {
      setFormData(emptyService);
    }
  }, [editingService]);

  const handleAddClick = () => {
    setEditingService(null);
    setFormData(emptyService);
    setShowForm(true);
    setFormError('');
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingService(null);
    setFormData(emptyService);
    setFormError('');
  };

  const handleEditClick = (service: Service) => {
    setEditingService(service);
    setFormError('');
  };

  const handleDeleteClick = async (service: Service) => {
    if (window.confirm(`Are you sure you want to delete "${service.name}"? This action cannot be undone.`)) {
      try {
        await deleteService(service.id);
        if (editingService?.id === service.id) {
          handleCancel();
        }
      } catch (error) {
        console.error('Failed to delete service:', error);
        alert(`Error: ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
      }
    }
  };

  const handlePricingChange = (size: 'small' | 'large', value: number) => {
    const price = !isNaN(value) && value >= 0 ? value : 0;
    setFormData(prev => ({ ...prev, pricing: { ...prev.pricing, [size]: price } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Service name is required.');
      return;
    }
    if (formData.pricing.small <= 0 && formData.pricing.large <= 0) {
      setFormError('At least one price (Small or Large) must be greater than zero.');
      return;
    }

    try {
      const serviceData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
      };

      if (editingService) {
        await updateService(editingService.id, serviceData);
      } else {
        await addService(serviceData);
      }
      handleCancel();
    } catch (error) {
      console.error('Failed to save service', error);
      const message = error instanceof Error ? error.message : 'An unknown error occurred.';
      setFormError(`Failed to save service: ${message}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background-light dark:bg-background-dark">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary-light dark:text-text-primary-dark">Motorcycle Services</h1>
            <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
              Manage the individual services available for motorcycles.
            </p>
          </div>
          {!showForm && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleAddClick}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-brand-blue hover:bg-brand-dark-blue transition-all duration-200"
              >
                <Wrench className="h-4 w-4 mr-2" />
                Add Service
              </button>
            </div>
          )}
        </div>

        {showForm && (
          <div className="bg-surface-light dark:bg-surface-dark p-4 sm:p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                {editingService ? 'Edit Service' : 'Add New Service'}
              </h3>
              <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                {editingService ? 'Update the details for this motorcycle service.' : 'Define a new service for motorcycles.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder="e.g., Change Oil"
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
                  placeholder="Briefly describe the service..."
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

              {formError && <p className="md:col-span-2 mt-2 text-sm text-red-500">{formError}</p>}
              
              <div className="md:col-span-2 flex justify-end gap-3">
                <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark bg-surface-light dark:bg-surface-dark border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-brand-blue rounded-lg hover:bg-brand-dark-blue">{editingService ? 'Save Changes' : 'Create Service'}</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-surface-light dark:bg-surface-dark shadow overflow-hidden rounded-lg border border-border-light dark:border-border-dark">
          <ul className="divide-y divide-border-light dark:divide-border-dark">
            {motorcycleServices.length > 0 ? motorcycleServices.map(service => (
              <li key={service.id} className="p-4 sm:p-6 hover:bg-background-light dark:hover:bg-background-dark transition-colors duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark truncate">{service.name}</h4>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1 truncate">
                      {service.description || 'No description available.'}
                    </p>
                  </div>
                  <div className="flex items-baseline gap-4 mt-4 sm:mt-0 sm:ml-6">
                    <div className="flex flex-col text-right">
                      <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Small</span>
                      <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                        ₱{(service.pricing as MotorcycleSizePricing)?.small ?? 'N/A'}
                      </span>
                    </div>
                     <div className="flex flex-col text-right">
                      <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Large</span>
                      <span className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                        ₱{(service.pricing as MotorcycleSizePricing)?.large ?? 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(service)}
                        className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        title="Edit Service"
                      >
                        <Edit2 className="h-4 w-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(service)}
                        className="p-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                        title="Delete Service"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            )) : (
              <div className="text-center py-12 px-6">
                <Wrench className="mx-auto h-12 w-12 text-text-secondary-light dark:text-text-secondary-dark opacity-50" />
                <h3 className="mt-2 text-base font-medium text-text-primary-light dark:text-text-primary-dark">No motorcycle services found</h3>
                <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Get started by adding your first service for motorcycles.
                </p>
              </div>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MotorcycleServicesPage; 
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Package, DollarSign } from 'lucide-react';

interface Service {
  id: string;
  name: string;
  price: number;
  description: string | null;
  pricing: {
    small: number;
    medium: number;
    large: number;
    extra_large: number;
  } | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ServicePackage {
  id: string;
  name: string;
  description: string | null;
  service_ids: string[];
  pricing: {
    small: number;
    medium: number;
    large: number;
    extra_large: number;
  };
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [activeTab, setActiveTab] = useState<'services' | 'packages'>('services');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Service | ServicePackage | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pricing: {
      small: 0,
      medium: 0,
      large: 0,
      extra_large: 0
    },
    service_ids: [] as string[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesResponse, packagesResponse] = await Promise.all([
        supabase.from('services').select('*').order('created_at', { ascending: false }),
        supabase.from('service_packages').select('*').order('created_at', { ascending: false })
      ]);

      if (servicesResponse.error) throw servicesResponse.error;
      if (packagesResponse.error) throw packagesResponse.error;

      setServices(servicesResponse.data || []);
      setPackages(packagesResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (activeTab === 'services') {
        if (editingItem) {
          const { error } = await supabase
            .from('services')
            .update({
              name: formData.name,
              description: formData.description,
              pricing: formData.pricing,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingItem.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('services')
            .insert([{
              name: formData.name,
              description: formData.description,
              pricing: formData.pricing,
              price: 0 // Keep for backward compatibility
            }]);

          if (error) throw error;
        }
      } else {
        if (editingItem) {
          const { error } = await supabase
            .from('service_packages')
            .update({
              name: formData.name,
              description: formData.description,
              service_ids: formData.service_ids,
              pricing: formData.pricing,
              updated_at: new Date().toISOString()
            })
            .eq('id', editingItem.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('service_packages')
            .insert([{
              name: formData.name,
              description: formData.description,
              service_ids: formData.service_ids,
              pricing: formData.pricing
            }]);

          if (error) throw error;
        }
      }

      setIsModalOpen(false);
      setEditingItem(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      pricing: {
        small: 0,
        medium: 0,
        large: 0,
        extra_large: 0
      },
      service_ids: []
    });
  };

  const handleEdit = (item: Service | ServicePackage) => {
    setEditingItem(item);
    if ('service_ids' in item) {
      // It's a package
      setFormData({
        name: item.name,
        description: item.description || '',
        pricing: item.pricing,
        service_ids: item.service_ids
      });
    } else {
      // It's a service
      setFormData({
        name: item.name,
        description: item.description || '',
        pricing: item.pricing || {
          small: 0,
          medium: 0,
          large: 0,
          extra_large: 0
        },
        service_ids: []
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, type: 'service' | 'package') => {
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        const table = type === 'service' ? 'services' : 'service_packages';
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchData();
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
      }
    }
  };

  const handleServiceSelection = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      service_ids: prev.service_ids.includes(serviceId)
        ? prev.service_ids.filter(id => id !== serviceId)
        : [...prev.service_ids, serviceId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Services & Packages</h1>
            <p className="text-gray-600 mt-2">Manage your services and service packages</p>
          </div>
          <button
            onClick={() => {
              setEditingItem(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add {activeTab === 'services' ? 'Service' : 'Package'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'services'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Services
          </button>
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'packages'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Packages
          </button>
        </div>

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(service.id, 'service')}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {service.pricing && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-700">Pricing by Size:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Small:</span>
                        <span className="font-medium">₱{service.pricing.small}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medium:</span>
                        <span className="font-medium">₱{service.pricing.medium}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Large:</span>
                        <span className="font-medium">₱{service.pricing.large}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Extra Large:</span>
                        <span className="font-medium">₱{service.pricing.extra_large}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {packages.map((pkg) => (
              <div key={pkg.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{pkg.name}</h3>
                      {pkg.description && (
                        <p className="text-sm text-gray-600 mt-1">{pkg.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(pkg)}
                      className="text-blue-600 hover:text-blue-800 p-1"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id, 'package')}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Pricing by Size:</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>Small:</span>
                        <span className="font-medium">₱{pkg.pricing.small}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Medium:</span>
                        <span className="font-medium">₱{pkg.pricing.medium}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Large:</span>
                        <span className="font-medium">₱{pkg.pricing.large}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Extra Large:</span>
                        <span className="font-medium">₱{pkg.pricing.extra_large}</span>
                      </div>
                    </div>
                  </div>

                  {pkg.service_ids.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Included Services:</h4>
                      <div className="text-sm text-gray-600">
                        {pkg.service_ids.length} service(s) included
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {((activeTab === 'services' && services.length === 0) || 
          (activeTab === 'packages' && packages.length === 0)) && (
          <div className="text-center py-12">
            {activeTab === 'services' ? (
              <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            ) : (
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            )}
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} yet
            </h3>
            <p className="text-gray-600">
              Add your first {activeTab === 'services' ? 'service' : 'package'} to get started
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingItem ? 'Edit' : 'Add New'} {activeTab === 'services' ? 'Service' : 'Package'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing by Size *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Small</label>
                    <input
                      type="number"
                      value={formData.pricing.small}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, small: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Medium</label>
                    <input
                      type="number"
                      value={formData.pricing.medium}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, medium: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Large</label>
                    <input
                      type="number"
                      value={formData.pricing.large}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, large: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Extra Large</label>
                    <input
                      type="number"
                      value={formData.pricing.extra_large}
                      onChange={(e) => setFormData({
                        ...formData,
                        pricing: { ...formData.pricing, extra_large: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              {activeTab === 'packages' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Included Services
                  </label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                    {services.map((service) => (
                      <label key={service.id} className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={formData.service_ids.includes(service.id)}
                          onChange={() => handleServiceSelection(service.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{service.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingItem ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
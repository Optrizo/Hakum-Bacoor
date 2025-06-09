import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Car, Phone, User } from 'lucide-react';

interface Car {
  id: string;
  plate: string;
  model: string;
  size: string;
  service: string;
  status: string;
  crew: string[] | null;
  phone: string;
  total_cost: number | null;
  services: string[] | null;
  created_at: string | null;
  updated_at: string | null;
}

interface Service {
  id: string;
  name: string;
  pricing: {
    small: number;
    medium: number;
    large: number;
    extra_large: number;
  } | null;
}

interface CrewMember {
  id: string;
  name: string;
  is_active: boolean;
}

export default function CarsPage() {
  const [cars, setCars] = useState<Car[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState({
    plate: '',
    model: '',
    size: 'small',
    service: '',
    phone: '',
    crew: [] as string[],
    services: [] as string[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [carsResponse, servicesResponse, crewResponse] = await Promise.all([
        supabase.from('cars').select('*').order('created_at', { ascending: false }),
        supabase.from('services').select('id, name, pricing'),
        supabase.from('crew_members').select('id, name, is_active').eq('is_active', true)
      ]);

      if (carsResponse.error) throw carsResponse.error;
      if (servicesResponse.error) throw servicesResponse.error;
      if (crewResponse.error) throw crewResponse.error;

      setCars(carsResponse.data || []);
      setServices(servicesResponse.data || []);
      setCrewMembers(crewResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalCost = () => {
    let total = 0;
    formData.services.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service && service.pricing) {
        const sizeKey = formData.size as keyof typeof service.pricing;
        total += service.pricing[sizeKey] || 0;
      }
    });
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const totalCost = calculateTotalCost();
      
      if (editingCar) {
        const { error } = await supabase
          .from('cars')
          .update({
            ...formData,
            total_cost: totalCost,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingCar.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cars')
          .insert([{
            ...formData,
            status: 'pending',
            total_cost: totalCost
          }]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingCar(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving car:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      plate: '',
      model: '',
      size: 'small',
      service: '',
      phone: '',
      crew: [],
      services: []
    });
  };

  const handleEdit = (car: Car) => {
    setEditingCar(car);
    setFormData({
      plate: car.plate,
      model: car.model,
      size: car.size,
      service: car.service,
      phone: car.phone,
      crew: car.crew || [],
      services: car.services || []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this car?')) {
      try {
        const { error } = await supabase
          .from('cars')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchData();
      } catch (error) {
        console.error('Error deleting car:', error);
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready_for_payment':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cars Management</h1>
            <p className="text-gray-600 mt-2">Manage car wash orders and track progress</p>
          </div>
          <button
            onClick={() => {
              setEditingCar(null);
              resetForm();
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Car
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div key={car.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Car className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{car.plate}</h3>
                    <p className="text-sm text-gray-600">{car.model}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(car)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(car.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium capitalize">{car.size}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">{car.service}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cost:</span>
                  <span className="font-medium">₱{(car.total_cost || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-gray-600 mb-4">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{car.phone}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(car.status)}`}>
                  {car.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>

        {cars.length === 0 && (
          <div className="text-center py-12">
            <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No cars yet</h3>
            <p className="text-gray-600">Add your first car to get started</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingCar ? 'Edit Car' : 'Add New Car'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    License Plate *
                  </label>
                  <input
                    type="text"
                    value={formData.plate}
                    onChange={(e) => setFormData({ ...formData, plate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Car Model *
                  </label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Car Size *
                  </label>
                  <select
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra_large">Extra Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <input
                  type="text"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Services
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {services.map((service) => (
                    <label key={service.id} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              services: [...formData.services, service.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              services: formData.services.filter(id => id !== service.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{service.name}</span>
                      {service.pricing && (
                        <span className="text-xs text-gray-500">
                          (₱{service.pricing[formData.size as keyof typeof service.pricing]})
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign Crew
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3">
                  {crewMembers.map((member) => (
                    <label key={member.id} className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        checked={formData.crew.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              crew: [...formData.crew, member.id]
                            });
                          } else {
                            setFormData({
                              ...formData,
                              crew: formData.crew.filter(id => id !== member.id)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{member.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {formData.services.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <div className="text-sm font-medium text-gray-700 mb-2">Total Cost:</div>
                  <div className="text-lg font-bold text-blue-600">₱{calculateTotalCost().toFixed(2)}</div>
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
                  {editingCar ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
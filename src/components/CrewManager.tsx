import React, { useState, useRef } from 'react';
import { useQueue } from '../context/QueueContext';
import { CrewMember } from '../types';
import { UserPlus, Edit2, Trash2, Phone, User } from 'lucide-react';

const CrewManager: React.FC = () => {
  const { crews, addCrew, updateCrew, removeCrew } = useQueue();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCrew, setEditingCrew] = useState<CrewMember | null>(null);
  const formStateRef = useRef<{ name: string; phone: string }>({ name: '', phone: '' });
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const setFormDataPersist = (data: { name: string; phone: string }) => {
    formStateRef.current = data;
    setFormData(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (formData.phone && !/^(\+63|0)[\d\s]{10,12}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid Philippine phone number';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      if (editingCrew) {
        await updateCrew(editingCrew.id, {
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
        });
        setEditingCrew(null);
      } else {
        await addCrew({
          name: formData.name.trim(),
          phone: formData.phone.trim() || undefined,
          is_active: true,
        });
        setShowAddForm(false);
      }
      setFormDataPersist({ name: '', phone: '' });
      setErrors({});
    } catch (error) {
      console.error('Error saving crew member:', error);
    }
  };

  const handleEdit = (crew: CrewMember) => {
    setEditingCrew(crew);
    setFormDataPersist({
      name: crew.name,
      phone: crew.phone || '',
    });
    setShowAddForm(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await removeCrew(id);
    } catch (error) {
      console.error('Error removing crew member:', error);
    }
  };

  const CrewForm = React.useMemo(() => (
    <div className="bg-gray-900 p-6 rounded-lg shadow-sm border border-gray-800 mb-6">
      <h3 className="text-lg font-medium text-white mb-4">
        {editingCrew ? 'Edit Crew Member' : 'Add New Crew Member'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormDataPersist({ ...formData, name: e.target.value })}
              className={`block w-full rounded-md bg-gray-800 border ${
                errors.name ? 'border-red-500' : 'border-gray-700'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white p-2`}
              placeholder="Enter crew member name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-1">
              Phone <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormDataPersist({ ...formData, phone: e.target.value })}
              className={`block w-full rounded-md bg-gray-800 border ${
                errors.phone ? 'border-red-500' : 'border-gray-700'
              } shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white p-2`}
              placeholder="e.g., 0912 345 6789"
            />
            {errors.phone && <p className="mt-1 text-sm text-red-400">{errors.phone}</p>}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={() => {
              setShowAddForm(false);
              setEditingCrew(null);
              setFormDataPersist({ name: '', phone: '' });
              setErrors({});
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-700 shadow-sm text-sm font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            {editingCrew ? 'Update Member' : 'Add Member'}
          </button>
        </div>
      </form>
    </div>
  ), [formData, errors, editingCrew]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Crew Management</h1>
          <p className="text-gray-400">Add, edit, or remove crew members</p>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-lg font-medium text-gray-400">{crews.length} Active Members</span>
          {!showAddForm && !editingCrew && (
            <button
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </button>
          )}
        </div>
      </div>

      {(showAddForm || editingCrew) && CrewForm}

      <div className="bg-gray-900 shadow overflow-hidden sm:rounded-md border border-gray-800">
        <ul className="divide-y divide-gray-800">
          {crews.map((member) => (
            <li key={member.id} className="px-6 py-4 hover:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-white">{member.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      {member.phone && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-1" />
                          {member.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(member)}
                    className="inline-flex items-center p-2 border border-gray-700 rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="inline-flex items-center p-2 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
          {crews.length === 0 && (
            <li className="px-6 py-8 text-center">
              <p className="text-gray-400">No crew members found. Add your first crew member to get started.</p>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CrewManager;
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to save crew member: ${errorMessage}. Please try again.`);
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
    if (window.confirm('Are you sure you want to delete this crew member? This action cannot be undone.')) {
      try {
        await removeCrew(id);
      } catch (error) {
        console.error('Error removing crew member:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Failed to delete crew member: ${errorMessage}. Please try again.`);
      }
    }
  };

  const CrewForm = React.useMemo(() => (
    <div className="bg-surface-light dark:bg-surface-dark p-4 sm:p-6 rounded-lg shadow-sm border border-border-light dark:border-border-dark mb-6">
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
          {editingCrew ? 'Edit Crew Member' : 'Add New Crew Member'}
        </h3>
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
          {editingCrew ? 'Update crew member information' : 'Add a new crew member to your team'}
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormDataPersist({ ...formData, name: e.target.value })}
              className={`block w-full rounded-lg bg-background-light dark:bg-background-dark border shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2.5 sm:p-2 transition-all duration-200 ${
                errors.name ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-border-light dark:border-border-dark'
              }`}
              placeholder="Enter crew member name"
              required
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500 flex items-start">
                <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.name}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark mb-1">
              Phone <span className="text-gray-500 text-xs">(Optional)</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormDataPersist({ ...formData, phone: e.target.value })}
              className={`block w-full rounded-lg bg-background-light dark:bg-background-dark border shadow-sm focus:ring-brand-blue focus:border-brand-blue sm:text-sm p-2.5 sm:p-2 transition-all duration-200 ${
                errors.phone ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500' : 'border-border-light dark:border-border-dark'
              }`}
              placeholder="e.g., 0912 345 6789"
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-500 flex items-start">
                <svg className="w-3 h-3 mr-1 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.phone}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setShowAddForm(false);
              setEditingCrew(null);
              setFormDataPersist({ name: '', phone: '' });
              setErrors({});
            }}
            className="inline-flex items-center justify-center px-4 py-2 border border-border-light dark:border-border-dark shadow-sm text-sm font-medium rounded-lg text-text-secondary-light dark:text-text-secondary-dark bg-surface-light dark:bg-surface-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-brand-blue hover:bg-brand-dark-blue transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            {editingCrew ? 'Update Member' : 'Add Member'}
          </button>
        </div>
      </form>
    </div>
  ), [formData, errors, editingCrew]);

  return (
    <div className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary-light dark:text-text-primary-dark truncate">Crew Management</h1>
            <p className="text-sm sm:text-base text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Add, edit, or remove crew members from your team
            </p>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <span className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark whitespace-nowrap">
              {crews.length} Active Members
            </span>
            {!showAddForm && !editingCrew && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-brand-blue hover:bg-brand-dark-blue transition-all duration-200 transform hover:scale-105 active:scale-95 whitespace-nowrap"
              >
                <UserPlus className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Add Member</span>
                <span className="xs:hidden">Add</span>
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        {(showAddForm || editingCrew) && CrewForm}

        {/* Crew List */}
        <div className="bg-surface-light dark:bg-surface-dark shadow overflow-hidden rounded-lg border border-border-light dark:border-border-dark">
          {crews.length === 0 ? (
            <div className="p-8 text-center">
              <User className="h-12 w-12 text-text-secondary-light dark:text-text-secondary-dark mx-auto mb-4 opacity-50" />
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm sm:text-base">
                No crew members added yet
              </p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
                Add your first crew member to get started
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border-light dark:divide-border-dark">
              {crews.map((member) => (
                <li key={member.id} className="px-3 sm:px-4 py-4 sm:px-6 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-brand-blue flex items-center justify-center">
                          <User className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-medium text-text-primary-light dark:text-text-primary-dark truncate">
                          {member.name}
                        </h3>
                        {member.phone && (
                          <div className="flex items-center text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
                            <Phone className="h-4 w-4 mr-1.5 flex-shrink-0" />
                            <span className="truncate">{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 self-end sm:self-center">
                      <button
                        onClick={() => handleEdit(member)}
                        className="inline-flex items-center p-2 border border-border-light dark:border-border-dark rounded-lg text-text-secondary-light dark:text-text-secondary-dark bg-surface-light dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Edit crew member"
                      >
                        <span className="sr-only">Edit {member.name}</span>
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="inline-flex items-center p-2 border border-transparent rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                        title="Delete crew member"
                      >
                        <span className="sr-only">Delete {member.name}</span>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrewManager;
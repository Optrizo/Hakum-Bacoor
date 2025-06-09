import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit2, Trash2, Phone, User } from 'lucide-react';

interface CrewMember {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

export default function CrewPage() {
  const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CrewMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    role: 'worker'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrewMembers();
  }, []);

  const fetchCrewMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('crew_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCrewMembers(data || []);
    } catch (error) {
      console.error('Error fetching crew members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMember) {
        const { error } = await supabase
          .from('crew_members')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMember.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('crew_members')
          .insert([formData]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      setEditingMember(null);
      setFormData({ name: '', phone: '', role: 'worker' });
      fetchCrewMembers();
    } catch (error) {
      console.error('Error saving crew member:', error);
    }
  };

  const handleEdit = (member: CrewMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      phone: member.phone || '',
      role: member.role
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this crew member?')) {
      try {
        const { error } = await supabase
          .from('crew_members')
          .delete()
          .eq('id', id);

        if (error) throw error;
        fetchCrewMembers();
      } catch (error) {
        console.error('Error deleting crew member:', error);
      }
    }
  };

  const toggleActive = async (member: CrewMember) => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .update({ 
          is_active: !member.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', member.id);

      if (error) throw error;
      fetchCrewMembers();
    } catch (error) {
      console.error('Error updating crew member status:', error);
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
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Crew Management</h1>
            <p className="text-gray-600 mt-2">Manage your team members and their roles</p>
          </div>
          <button
            onClick={() => {
              setEditingMember(null);
              setFormData({ name: '', phone: '', role: 'worker' });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Crew Member
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crewMembers.map((member) => (
            <div
              key={member.id}
              className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                member.is_active ? 'border-green-500' : 'border-gray-400'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    member.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{member.name}</h3>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      member.role === 'supervisor' 
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(member)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {member.phone && (
                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Phone className="w-4 h-4" />
                  <span className="text-sm">{member.phone}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${
                  member.is_active ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {member.is_active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => toggleActive(member)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    member.is_active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {member.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {crewMembers.length === 0 && (
          <div className="text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No crew members yet</h3>
            <p className="text-gray-600">Add your first crew member to get started</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingMember ? 'Edit Crew Member' : 'Add New Crew Member'}
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
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="worker">Worker</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
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
                  {editingMember ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
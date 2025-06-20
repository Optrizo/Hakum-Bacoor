import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { Car, SERVICE_STATUSES } from '../types';
import StatusBadge from './StatusBadge';
import { Edit2, Trash2, Check, X, DollarSign, CheckCircle, Wrench as Tool, Users, XCircle } from 'lucide-react';
import EditCarForm from './EditCarForm';

interface QueueItemProps {
  car: Car;
}

const QueueItem: React.FC<QueueItemProps> = ({ car }) => {
  const { updateCar, removeCar, crews } = useQueue();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigningCrew, setIsAssigningCrew] = useState(false);
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>(car.crew || []);

  const handleQuickAction = async (newStatus: Car['status']) => {
    try {
      setIsUpdating(true);
      await updateCar(car.id, { 
        status: newStatus,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (isConfirmingDelete) {
      try {
        setIsDeleting(true);
        await removeCar(car.id);
      } catch (error) {
        console.error('Error deleting car:', error);
        setIsConfirmingDelete(false);
      } finally {
        setIsDeleting(false);
      }
    } else {
      setIsConfirmingDelete(true);
    }
  };

  const cancelDelete = () => {
    setIsConfirmingDelete(false);
  };

  const handleCrewToggle = (crewId: string) => {
    setSelectedCrewIds(prev => 
      prev.includes(crewId)
        ? prev.filter(id => id !== crewId)
        : [...prev, crewId]
    );
  };

  const handleAssignCrew = async () => {
    try {
      setIsUpdating(true);
      await updateCar(car.id, { 
        crew: selectedCrewIds,
        updated_at: new Date().toISOString()
      });
      setIsAssigningCrew(false);
    } catch (error) {
      console.error('Error assigning crew:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm border-l-4 border-brand-blue overflow-hidden transition-all duration-300 border border-border-light dark:border-border-dark">
        <div className="p-4 sm:p-6">
          <EditCarForm car={car} onComplete={() => setIsEditing(false)} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-surface-light dark:bg-surface-dark rounded-lg shadow-sm overflow-hidden transition-all duration-300 border border-border-light dark:border-border-dark
        ${
          car.status === 'waiting' 
            ? 'border-l-4 border-brand-blue' 
            : car.status === 'in-progress' 
              ? 'border-l-4 border-brand-cyan' 
              : car.status === 'completed' 
                ? 'border-l-4 border-green-500' 
                : car.status === 'payment-pending'
                  ? 'border-l-4 border-yellow-400'
                  : car.status === 'cancelled'
                    ? 'border-l-4 border-red-500'
                    : 'border-l-4 border-brand-gray'
        }
      `}
    >
      <div className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3">
          <div className="flex-grow mb-3 sm:mb-0">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-shrink-0 bg-brand-blue text-white font-bold text-base px-3 py-1 rounded-md">
                {car.plate}
              </div>
              <span className="text-lg font-medium text-text-primary-light dark:text-text-primary-dark">{car.model}</span>
            </div>
            <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark capitalize">({car.size})</span>
          </div>
          <div className="flex-shrink-0">
            <StatusBadge status={car.status} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
          <div>
            <h4 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">Service</h4>
            <p className="text-text-primary-light dark:text-text-primary-dark font-medium">{car.service}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">Phone</h4>
            <p className="text-text-primary-light dark:text-text-primary-dark">{car.phone || 'N/A'}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">Total Cost</h4>
            <p className="text-lg font-bold text-green-500 dark:text-green-400">₱{(car.total_cost || 0).toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">Added</h4>
            <p className="text-text-primary-light dark:text-text-primary-dark">
              {new Date(car.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">Crew</h4>
          {car.crew && car.crew.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {car.crew.map((crewId) => {
                const crewMember = crews.find(c => c.id === crewId);
                return crewMember ? (
                  <span key={crewId} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark">
                    {crewMember.name}
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            <span className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Not assigned</span>
          )}
        </div>

        {isAssigningCrew && (
          <div className="mb-4 p-4 bg-background-light dark:bg-black/50 rounded-lg border border-border-light dark:border-border-dark">
            <div className="flex flex-col space-y-2">
              <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                Select Crew Members
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-2">
                {crews.map(member => (
                  <label key={member.id} className="flex items-center cursor-pointer p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800">
                    <input
                      type="checkbox"
                      checked={selectedCrewIds.includes(member.id)}
                      onChange={() => handleCrewToggle(member.id)}
                      className="form-checkbox h-4 w-4 text-brand-blue bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark rounded focus:ring-brand-blue"
                    />
                    <span className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark">{member.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end space-x-2 mt-3">
                <button
                  onClick={() => setIsAssigningCrew(false)}
                  className="inline-flex items-center px-3 py-1.5 border border-border-light dark:border-border-dark shadow-sm text-xs font-medium rounded-md text-text-primary-light dark:text-text-primary-dark bg-surface-light dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark focus:ring-brand-blue"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignCrew}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-brand-blue hover:bg-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark focus:ring-brand-blue"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:justify-between md:items-center mt-4 border-t border-border-light dark:border-border-dark pt-4">
          <div className="mb-4 md:mb-0">
            <label className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-2 block">
              Quick Actions
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickAction('in-progress')}
                disabled={car.status === 'in-progress' || isUpdating}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-sky-500/20 text-sky-400 hover:bg-sky-500/30 transition-colors disabled:opacity-50 border border-sky-500/30"
              >
                <Tool className="h-4 w-4 mr-1.5" />
                Start
              </button>
              <button
                onClick={() => handleQuickAction('payment-pending')}
                disabled={car.status === 'payment-pending' || isUpdating}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 transition-colors disabled:opacity-50 border border-yellow-500/30"
              >
                <DollarSign className="h-4 w-4 mr-1.5" />
                Payment
              </button>
              <button
                onClick={() => handleQuickAction('completed')}
                disabled={car.status === 'completed' || isUpdating}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50 border border-green-500/30"
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Done
              </button>
              <button
                onClick={() => handleQuickAction('cancelled')}
                disabled={car.status === 'cancelled' || isUpdating}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50 border border-red-500/30"
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Cancel
              </button>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsAssigningCrew(true)}
              className="inline-flex items-center p-2 border border-border-light dark:border-border-dark shadow-sm text-xs font-medium rounded-md text-text-secondary-light dark:text-text-secondary-dark bg-surface-light dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark focus:ring-brand-blue"
              disabled={isUpdating || isDeleting}
            >
              <Users className="h-4 w-4" />
              <span className="sr-only">Assign Crew</span>
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center p-2 border border-border-light dark:border-border-dark shadow-sm text-xs font-medium rounded-md text-text-secondary-light dark:text-text-secondary-dark bg-surface-light dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark focus:ring-brand-blue"
              disabled={isUpdating || isDeleting}
            >
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </button>

            {isConfirmingDelete ? (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  disabled={isDeleting}
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
                <button
                  onClick={cancelDelete}
                  className="inline-flex items-center px-3 py-1.5 border border-[#878EA0] shadow-sm text-xs font-medium rounded-md text-white bg-[#878EA0] hover:bg-[#DCE3EB] hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#116AF8]"
                  disabled={isDeleting}
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                disabled={isUpdating || isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueItem;
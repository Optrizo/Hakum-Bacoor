import React, { useState, useEffect, useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import { Car } from '../types';
import StatusBadge from './StatusBadge';
import { Edit2, Trash2, Check, X, DollarSign, CheckCircle, Wrench as Tool, Users, XCircle, ChevronDown } from 'lucide-react';
import EditCarForm from './EditCarForm';

interface QueueItemProps {
  car: Car;
}

const QueueItem: React.FC<QueueItemProps> = ({ car }) => {
  const { updateCar, removeCar, crews, cars } = useQueue();
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAssigningCrew, setIsAssigningCrew] = useState(false);
  const [showCrewWarning, setShowCrewWarning] = useState(false);
  const [selectedCrewIds, setSelectedCrewIds] = useState<string[]>(car.crew || []);
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 640);

  const busyCrewIds = useMemo(() => {
    const today = new Date();
    const isToday = (dateString: string) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
    };

    const busyIds = new Set<string>();
    cars.forEach(c => {
      // A crew member is busy if another car is 'in-progress' AND was created today.
      if (c.status === 'in-progress' && c.id !== car.id && isToday(c.created_at)) {
        c.crew?.forEach(crewId => busyIds.add(crewId));
      }
    });
    return busyIds;
  }, [cars, car.id]);

  useEffect(() => {
    const checkSize = () => {
      setIsCollapsed(window.innerWidth < 640);
    };
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const handleStartServiceClick = () => {
    if (!car.crew || car.crew.length === 0) {
      setShowCrewWarning(true);
      setIsAssigningCrew(true);
    } else {
      handleQuickAction('in-progress');
    }
  };

  const handleQuickAction = async (newStatus: Car['status']) => {
    // Prevent status change if crew warning is active for another action
    if (showCrewWarning && newStatus === 'in-progress') {
      return;
    }
    try {
      setIsUpdating(true);
      await updateCar(car.id, { 
        status: newStatus,
        updated_at: new Date().toISOString()
      });
      setIsAssigningCrew(false);
    } catch (error) {
      console.error('Error updating status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to update status: ${errorMessage}. Please try again.`);
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
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        alert(`Failed to delete vehicle: ${errorMessage}. Please try again.`);
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

      const updates: Partial<Car> = {
        crew: selectedCrewIds,
        updated_at: new Date().toISOString()
      };

      if (car.status === 'waiting' && selectedCrewIds.length > 0) {
        updates.status = 'in-progress';
      }

      await updateCar(car.id, updates);

      setIsAssigningCrew(false);
      setShowCrewWarning(false);
    } catch (error) {
      console.error('Error assigning crew:', error);
      alert(`Failed to assign crew: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const cancelCrewAssignment = () => {
    setIsAssigningCrew(false);
    setShowCrewWarning(false);
    setSelectedCrewIds(car.crew || []);
  };

  const toggleCollapse = (e: React.MouseEvent) => {
    // Prevent toggling when clicking on a button or interactive element
    if (e.target instanceof HTMLElement && e.target.closest('button, a, input')) {
      return;
    }
    if (window.innerWidth < 640) {
      setIsCollapsed(!isCollapsed);
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
      <div className="p-3 sm:p-4 sm:cursor-default" onClick={toggleCollapse}>
        <div className="flex items-start justify-between">
            <div className="flex-grow min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-1">
                    <div className="flex-shrink-0 bg-brand-blue text-white font-bold text-xs sm:text-sm lg:text-base px-2 sm:px-3 py-1 rounded-md">
              {car.plate}
                    </div>
                    <span className="text-sm sm:text-base lg:text-lg font-medium text-text-primary-light dark:text-text-primary-dark truncate">{car.model}</span>
                </div>
                <span className="text-xs sm:text-sm text-text-secondary-light dark:text-text-secondary-dark capitalize">({car.size})</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="hidden sm:block">
                    <StatusBadge status={car.status} />
                </div>
                <button className="sm:hidden p-1">
                    <ChevronDown className={`h-4 w-4 sm:h-5 sm:w-5 text-gray-400 transition-transform duration-200 ${!isCollapsed ? 'transform rotate-180' : ''}`} />
                </button>
            </div>
          </div>
        <div className="sm:hidden mt-2">
          <StatusBadge status={car.status} />
        </div>

        {!isCollapsed && (
          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border-light dark:border-border-dark">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4 text-sm">
          <div>
                <h4 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">Service</h4>
                <p className="text-text-primary-light dark:text-text-primary-dark font-medium text-sm sm:text-base break-words">{car.service}</p>
          </div>
          <div>
                <h4 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">Phone</h4>
                <p className="text-text-primary-light dark:text-text-primary-dark text-sm sm:text-base">{car.phone || 'N/A'}</p>
          </div>
          <div>
                <h4 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">Total Cost</h4>
                <p className="text-sm sm:text-base lg:text-lg font-bold text-green-500 dark:text-green-400">₱{(car.total_cost || 0).toLocaleString()}</p>
          </div>
          <div>
                <h4 className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-1">Added</h4>
                <p className="text-text-primary-light dark:text-text-primary-dark text-sm sm:text-base">
                  {new Date(car.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="mb-3 sm:mb-4">
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
              <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-background-light dark:bg-black/50 rounded-lg border border-border-light dark:border-border-dark">
                <div className="flex flex-col space-y-3">
                  <label className="block text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                Select Crew Members
              </label>
                  {showCrewWarning && (
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700 rounded-md">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Action Required:</strong> Please assign at least one crew member before starting the service.
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto pr-2">
                {crews.map(member => {
                  const isBusy = busyCrewIds.has(member.id);
                  return (
                    <label 
                      key={member.id} 
                      className={`flex items-center justify-between cursor-pointer p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors ${
                        isBusy ? 'cursor-not-allowed opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedCrewIds.includes(member.id)}
                          onChange={() => handleCrewToggle(member.id)}
                          disabled={isBusy}
                          className="form-checkbox h-4 w-4 text-brand-blue bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark rounded focus:ring-brand-blue"
                        />
                        <span className="ml-2 text-sm text-text-primary-light dark:text-text-primary-dark truncate">{member.name}</span>
                      </div>
                      {isBusy && (
                        <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/50 px-2 py-1 rounded-full">Busy</span>
                      )}
                    </label>
                  );
                })}
              </div>
                  <div className="flex flex-col sm:flex-row justify-end gap-2 mt-3">
                <button
                      onClick={cancelCrewAssignment}
                      className="inline-flex items-center justify-center px-3 py-1.5 border border-border-light dark:border-border-dark shadow-sm text-xs font-medium rounded-md text-text-primary-light dark:text-text-primary-dark bg-surface-light dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark focus:ring-brand-blue transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignCrew}
                      className="inline-flex items-center justify-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-brand-blue hover:bg-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark focus:ring-brand-blue transition-colors"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

            <div className="flex flex-col gap-3 sm:gap-4 mt-3 sm:mt-4 border-t border-border-light dark:border-border-dark pt-3 sm:pt-4">
              <div className="w-full">
                <label className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark uppercase tracking-wider mb-2 block">
              Quick Actions
            </label>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  {car.status === 'waiting' && (
              <button
                      onClick={handleStartServiceClick}
                      disabled={isUpdating}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-semibold bg-brand-blue text-white hover:bg-brand-dark-blue transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95"
              >
                      <Tool className="h-4 w-4 mr-2" />
                Start Service
              </button>
                  )}
                  {car.status === 'in-progress' && (
              <button
                onClick={() => handleQuickAction('payment-pending')}
                      disabled={isUpdating}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95"
              >
                      <DollarSign className="h-4 w-4 mr-2" />
                Ready for Payment
              </button>
                  )}
                  {car.status === 'payment-pending' && (
              <button
                onClick={() => handleQuickAction('completed')}
                      disabled={isUpdating}
                      className="inline-flex items-center justify-center px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg text-sm font-semibold bg-green-500 text-white hover:bg-green-600 transition-all duration-200 disabled:opacity-50 transform hover:scale-105 active:scale-95"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </button>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(car.status === 'in-progress' || car.status === 'payment-pending') && (
                      <button
                        onClick={() => handleQuickAction('waiting')}
                        disabled={isUpdating}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        Send to Waiting
                      </button>
                    )}
                    
                    {car.status !== 'completed' && car.status !== 'cancelled' && (
                      <button
                        onClick={() => handleQuickAction('cancelled')}
                        disabled={isUpdating}
                        className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/20 text-red-500 hover:bg-red-500/30 dark:text-red-400 dark:hover:bg-red-500/40 transition-colors disabled:opacity-50"
              >
                        <XCircle className="h-4 w-4 mr-1.5" />
                        Cancel
              </button>
                    )}
                  </div>
            </div>
          </div>

              <div className="flex flex-wrap gap-2 justify-end">
            <button
                  onClick={() => setIsAssigningCrew(!isAssigningCrew)}
                  className={`inline-flex items-center p-1.5 sm:p-2 border shadow-sm text-xs font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-colors ${
                    isAssigningCrew 
                      ? 'bg-brand-blue text-white border-transparent' 
                      : 'bg-surface-light dark:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark border-border-light dark:border-border-dark hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              disabled={isUpdating || isDeleting}
                  title="Assign Crew"
            >
                  <Users className="h-4 w-4" />
                  <span className="sr-only">Assign Crew</span>
            </button>
            <button
              onClick={() => setIsEditing(true)}
                  className="inline-flex items-center p-1.5 sm:p-2 border border-border-light dark:border-border-dark shadow-sm text-xs font-medium rounded-md text-text-secondary-light dark:text-text-secondary-dark bg-surface-light dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark focus:ring-brand-blue transition-colors"
              disabled={isUpdating || isDeleting}
                  title="Edit Vehicle"
            >
                  <Edit2 className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
            </button>

            {isConfirmingDelete ? (
                  <div className="flex gap-2 items-center">
                <button
                  onClick={handleDelete}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors" 
                  disabled={isDeleting}
                >
                      <Check className="h-4 w-4 mr-1.5" />
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
                <button
                  onClick={cancelDelete}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                      <X className="h-4 w-4 mr-1.5" />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleDelete}
                    className="inline-flex items-center p-2 border border-border-light dark:border-border-dark shadow-sm text-xs font-medium rounded-md text-red-500 hover:bg-red-500/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface-light dark:focus:ring-offset-surface-dark focus:ring-red-500 transition-colors"
                disabled={isUpdating || isDeleting}
                    title="Delete Vehicle"
              >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
              </button>
            )}
          </div>
        </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueItem;
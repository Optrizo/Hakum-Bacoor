import React, { useState } from 'react';
import { useQueue } from '../context/QueueContext';
import { Car, SERVICE_STATUSES } from '../types';
import StatusBadge from './StatusBadge';
import { Edit2, Trash2, Check, X, DollarSign, CheckCircle, Wrench as Tool, Users } from 'lucide-react';
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
      <div className="bg-[#0B2699] rounded-lg shadow-sm border-l-4 border-[#116AF8] overflow-hidden transition-all duration-300 border border-[#878EA0]">
        <div className="p-6">
          <EditCarForm car={car} onComplete={() => setIsEditing(false)} />
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-[#0B2699] rounded-lg shadow-sm overflow-hidden transition-all duration-300 border border-[#878EA0]
        ${
          car.status === 'waiting' 
            ? 'border-l-4 border-[#116AF8]' 
            : car.status === 'in-progress' 
              ? 'border-l-4 border-[#20BCED]' 
              : car.status === 'completed' 
                ? 'border-l-4 border-green-500' 
                : car.status === 'payment-pending'
                  ? 'border-l-4 border-[#116AF8]'
                  : 'border-l-4 border-[#878EA0]'
        }
      `}
    >
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="flex-shrink-0 bg-[#116AF8] text-white font-bold text-lg px-3 py-1 rounded-md">
              {car.plate}
            </div>
            <span className="text-lg font-medium text-white">{car.model}</span>
            <span className="text-sm text-[#DCE3EB] capitalize">({car.size})</span>
          </div>
          <StatusBadge status={car.status} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-4">
          <div>
            <h4 className="text-xs font-medium text-[#DCE3EB] uppercase tracking-wider mb-1">Service</h4>
            <p className="text-white font-medium">{car.service}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-[#DCE3EB] uppercase tracking-wider mb-1">Phone</h4>
            <p className="text-white">{car.phone || 'Not provided'}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-[#DCE3EB] uppercase tracking-wider mb-1">Total Cost</h4>
            <p className="text-lg font-bold text-green-400">₱{(car.total_cost || 0).toLocaleString()}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-[#DCE3EB] uppercase tracking-wider mb-1">Added</h4>
            <p className="text-white">
              {new Date(car.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-xs font-medium text-[#DCE3EB] uppercase tracking-wider mb-1">Crew</h4>
          {car.crew && car.crew.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {car.crew.map((crewId, index) => {
                const crewMember = crews.find(c => c.id === crewId);
                return crewMember ? (
                  <span key={index} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#878EA0] text-white border border-[#DCE3EB]">
                    {crewMember.name}
                  </span>
                ) : null;
              })}
            </div>
          ) : (
            <span className="text-[#DCE3EB]">Not assigned</span>
          )}
        </div>

        {isAssigningCrew && (
          <div className="mb-4 p-4 bg-black rounded-lg border border-[#878EA0]">
            <div className="flex flex-col space-y-2">
              <label className="block text-sm font-medium text-white">
                Select Crew Members
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {crews.map(member => (
                  <label key={member.id} className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCrewIds.includes(member.id)}
                      onChange={() => handleCrewToggle(member.id)}
                      className="form-checkbox h-4 w-4 text-[#116AF8] bg-[#0B2699] border-[#878EA0] rounded focus:ring-[#116AF8]"
                    />
                    <span className="ml-2 text-sm text-white">{member.name}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  onClick={() => setIsAssigningCrew(false)}
                  className="inline-flex items-center px-3 py-1.5 border border-[#878EA0] shadow-sm text-xs font-medium rounded-md text-white bg-[#878EA0] hover:bg-[#DCE3EB] hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#116AF8]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignCrew}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded-md text-white bg-[#116AF8] hover:bg-[#20BCED] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#116AF8]"
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="sm:flex sm:justify-between sm:items-center mt-6 border-t border-[#878EA0] pt-4">
          <div className="mb-4 sm:mb-0">
            <label className="text-xs font-medium text-[#DCE3EB] uppercase tracking-wider mb-2 block">
              Quick Actions
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickAction('in-progress')}
                disabled={car.status === 'in-progress' || isUpdating}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#20BCED]/20 text-[#20BCED] hover:bg-[#20BCED]/30 transition-colors disabled:opacity-50 border border-[#20BCED]/30"
              >
                <Tool className="h-4 w-4 mr-1" />
                Start Service
              </button>
              <button
                onClick={() => handleQuickAction('payment-pending')}
                disabled={car.status === 'payment-pending' || isUpdating}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-[#116AF8]/20 text-[#116AF8] hover:bg-[#116AF8]/30 transition-colors disabled:opacity-50 border border-[#116AF8]/30"
              >
                <DollarSign className="h-4 w-4 mr-1" />
                Ready for Payment
              </button>
              <button
                onClick={() => handleQuickAction('completed')}
                disabled={car.status === 'completed' || isUpdating}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50 border border-green-500/30"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Completed
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsAssigningCrew(true)}
              className="inline-flex items-center px-3 py-1.5 border border-[#878EA0] shadow-sm text-xs font-medium rounded-md text-white bg-[#878EA0] hover:bg-[#DCE3EB] hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#116AF8]"
              disabled={isUpdating || isDeleting}
            >
              <Users className="h-3.5 w-3.5 mr-1" />
              Assign Crew
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-1.5 border border-[#878EA0] shadow-sm text-xs font-medium rounded-md text-white bg-[#878EA0] hover:bg-[#DCE3EB] hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#116AF8]"
              disabled={isUpdating || isDeleting}
            >
              <Edit2 className="h-3.5 w-3.5 mr-1" />
              Edit
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
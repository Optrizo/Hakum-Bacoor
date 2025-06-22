import React from 'react';
import QueueList from './QueueList';
import { Plus, X } from 'lucide-react';
import AddCarForm from './AddCarForm';

const QueueManager: React.FC = () => {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);

  return (
    <div className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-6 xl:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-blue truncate">Service Queue</h1>
            <p className="text-xs sm:text-sm lg:text-base text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Manage your auto service queue and track progress
            </p>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)} 
            className="w-full sm:w-auto inline-flex items-center justify-center px-3 sm:px-4 py-2.5 sm:py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-brand-blue hover:bg-brand-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-blue transition-all duration-200 transform hover:scale-105 active:scale-95"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            <span className="hidden xs:inline">Add Vehicle</span>
            <span className="xs:hidden">Add</span>
          </button>
        </div>

        <QueueList />
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4">
          <div className="relative bg-surface-light dark:bg-surface-dark rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-95 sm:scale-100">
            <div className="sticky top-0 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark px-3 sm:px-4 lg:px-6 py-3 sm:py-4 flex justify-between items-center">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">
                Add New Vehicle
              </h2>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1.5 sm:p-2 rounded-lg text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                aria-label="Close modal"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="p-3 sm:p-4 lg:p-6">
              <AddCarForm onComplete={() => setIsAddModalOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueManager;
import React, { useState, useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import QueueItem from './QueueItem';
import { Search, Filter, Calendar, AlertCircle } from 'lucide-react';
import { ServiceStatus, DATE_FILTERS } from '../types';

const QueueList: React.FC = () => {
  const { cars, loading, error } = useQueue();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>('waiting');
  const [dateFilter, setDateFilter] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const matchesSearch = 
        car.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.phone.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || car.status === statusFilter;

      const matchesCompleted = showCompleted || car.status !== 'completed';

      const carDate = new Date(car.created_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const matchesDate = dateFilter === 'all' || (
        (dateFilter === 'today' && carDate.toDateString() === today.toDateString()) ||
        (dateFilter === 'yesterday' && carDate.toDateString() === yesterday.toDateString()) ||
        (dateFilter === 'month' && carDate.getMonth() === today.getMonth() && carDate.getFullYear() === today.getFullYear())
      );
      
      return matchesSearch && matchesStatus && matchesDate && matchesCompleted;
    });
  }, [cars, searchTerm, statusFilter, dateFilter, showCompleted]);

  const waitingCount = cars.filter(car => car.status === 'waiting').length;
  const inProgressCount = cars.filter(car => car.status === 'in-progress').length;
  const paymentPendingCount = cars.filter(car => car.status === 'payment-pending').length;

  if (error) {
    return (
      <div className="bg-red-900/10 border border-red-900/20 rounded-lg p-4 flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-red-400">Error loading queue</h3>
          <p className="mt-1 text-sm text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-black p-4 sm:p-6 rounded-lg shadow-lg border border-gray-800">
        <div className="flex flex-col gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search plate, model, service or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-md leading-5 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="block w-full pl-3 pr-10 py-2 bg-gray-900 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                {DATE_FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ServiceStatus | 'all')}
                className="block w-full pl-3 pr-10 py-2 bg-gray-900 border border-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="in-progress">In Progress</option>
                <option value="payment-pending">Ready for Payment</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 bg-gray-900 border-gray-700 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-400">Show Completed</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black rounded-lg p-4 sm:p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Waiting</p>
              <p className="text-2xl font-bold text-white">{waitingCount}</p>
            </div>
            <div className="bg-blue-600/10 rounded-full p-3">
              <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-bold">{waitingCount}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-black rounded-lg p-4 sm:p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">In Progress</p>
              <p className="text-2xl font-bold text-white">{inProgressCount}</p>
            </div>
            <div className="bg-sky-400/10 rounded-full p-3">
              <div className="h-8 w-8 rounded-full bg-sky-400 flex items-center justify-center">
                <span className="text-white font-bold">{inProgressCount}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-black rounded-lg p-4 sm:p-6 border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">Payment Pending</p>
              <p className="text-2xl font-bold text-white">{paymentPendingCount}</p>
            </div>
            <div className="bg-blue-500/10 rounded-full p-3">
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">{paymentPendingCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-black p-8 text-center rounded-lg border border-gray-800">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 bg-blue-600/20 rounded-full mb-4"></div>
            <div className="h-4 w-32 bg-gray-800 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-800 rounded"></div>
          </div>
        </div>
      ) : filteredCars.length > 0 ? (
        <div className="space-y-4">
          {filteredCars.map(car => (
            <QueueItem key={car.id} car={car} />
          ))}
        </div>
      ) : (
        <div className="bg-black p-8 text-center rounded-lg border border-gray-800">
          <p className="text-gray-400">No vehicles match your search criteria</p>
        </div>
      )}
    </div>
  );
};

export default QueueList;
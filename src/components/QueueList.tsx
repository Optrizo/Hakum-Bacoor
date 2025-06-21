import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useQueue } from '../context/QueueContext';
import QueueItem from './QueueItem';
import { Search, Filter, Calendar, AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ServiceStatus } from '../types';

const QueueList: React.FC = () => {
  const { cars, loading, error } = useQueue();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'all'>('waiting');
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedDate, setSelectedDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const matchesSearch = 
        car.plate.toLowerCase().includes(searchTerm.toLowerCase()) || 
        car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.phone.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || car.status === statusFilter;

      const carDate = new Date(car.created_at);
      const today = new Date();
      
      let matchesDate = false;
      if (dateFilter === 'today') {
        matchesDate = carDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'all') {
        matchesDate = true;
      } else if (dateFilter === 'custom' && selectedDate) {
        const selectedDateObj = new Date(selectedDate);
        matchesDate = carDate.toDateString() === selectedDateObj.toDateString();
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [cars, searchTerm, statusFilter, dateFilter, selectedDate]);

  // Get cars filtered by date only (for statistics)
  const dateFilteredCars = useMemo(() => {
    return cars.filter(car => {
      const carDate = new Date(car.created_at);
      const today = new Date();
      
      let matchesDate = false;
      if (dateFilter === 'today') {
        matchesDate = carDate.toDateString() === today.toDateString();
      } else if (dateFilter === 'all') {
        matchesDate = true;
      } else if (dateFilter === 'custom' && selectedDate) {
        const selectedDateObj = new Date(selectedDate);
        matchesDate = carDate.toDateString() === selectedDateObj.toDateString();
      }
      
      return matchesDate;
    });
  }, [cars, dateFilter, selectedDate]);

  const waitingCount = dateFilteredCars.filter(car => car.status === 'waiting').length;
  const inProgressCount = dateFilteredCars.filter(car => car.status === 'in-progress').length;
  const paymentPendingCount = dateFilteredCars.filter(car => car.status === 'payment-pending').length;
  const cancelledCount = dateFilteredCars.filter(car => car.status === 'cancelled').length;
  const completedCount = dateFilteredCars.filter(car => car.status === 'completed').length;

  // Calendar functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleDateSelect = (day: number) => {
    const selectedDateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const formattedDate = formatDate(selectedDateObj);
    setSelectedDate(formattedDate);
    setDateFilter('custom');
    setShowCalendar(false);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isSelectedDate = (day: number) => {
    if (!selectedDate) return false;
    const selectedDateObj = new Date(selectedDate);
    return day === selectedDateObj.getDate() && 
           currentMonth.getMonth() === selectedDateObj.getMonth() && 
           currentMonth.getFullYear() === selectedDateObj.getFullYear();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isTodayDate = isToday(day);
      const isSelected = isSelectedDate(day);
      
      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          className={`h-8 w-8 rounded-full text-sm font-medium transition-colors ${
            isSelected 
              ? 'bg-blue-600 text-white' 
              : isTodayDate 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/40' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
          }`}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const quickDateOptions = [
    { label: 'Today', value: 'today' },
    { label: 'Yesterday', value: 'yesterday' },
    { label: 'This Week', value: 'this-week' },
    { label: 'Last Week', value: 'last-week' },
    { label: 'All Time', value: 'all' },
  ];

  const handleQuickDateSelect = (value: string) => {
    setDateFilter(value);
    setSelectedDate('');
    setShowCalendar(false);
    
    if (value === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setSelectedDate(formatDate(yesterday));
      setDateFilter('custom');
    } else if (value === 'this-week') {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      setSelectedDate(formatDate(startOfWeek));
      setDateFilter('custom');
    } else if (value === 'last-week') {
      const today = new Date();
      const startOfLastWeek = new Date(today);
      startOfLastWeek.setDate(today.getDate() - today.getDay() - 7);
      setSelectedDate(formatDate(startOfLastWeek));
      setDateFilter('custom');
    }
  };

  // Keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setShowCalendar(false);
    }
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    const today = new Date();
    setSelectedDate(formatDate(today));
    setDateFilter('custom');
    setShowCalendar(false);
  };

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-600 dark:text-red-400">Error loading queue</h3>
          <p className="mt-1 text-sm text-red-500 dark:text-red-300">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-xs bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300 px-2 py-1 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6">
      <div className="bg-surface-light dark:bg-surface-dark p-3 sm:p-4 rounded-lg shadow-lg border border-border-light dark:border-border-dark">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-text-secondary-light dark:text-text-secondary-dark" />
            </div>
            <input
              type="text"
              placeholder="Search plate, model, service or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg leading-5 placeholder-text-secondary-light dark:placeholder-text-secondary-dark focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-sm transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="relative">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-text-secondary-light dark:text-text-secondary-dark flex-shrink-0" />
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  onKeyDown={handleKeyDown}
                  className="block w-full pl-3 pr-10 py-2.5 sm:py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-sm text-left flex items-center justify-between transition-all duration-200"
                  aria-label="Select date"
                  aria-expanded={showCalendar}
                >
                  <span className="text-text-primary-light dark:text-text-primary-dark truncate">
                    {dateFilter === 'today' ? 'Today' : 
                     dateFilter === 'all' ? 'All Time' : 
                     selectedDate ? formatDisplayDate(selectedDate) : 'Choose a Day'}
                  </span>
                  <ChevronRight className={`h-4 w-4 sm:h-5 sm:w-5 transition-transform duration-200 text-text-secondary-light dark:text-text-secondary-dark ${showCalendar ? 'rotate-90' : ''}`} />
                </button>
              </div>

              {showCalendar && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-lg shadow-xl z-50 p-3 sm:p-4 max-h-96 overflow-y-auto" ref={calendarRef}>
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                      className="p-1.5 sm:p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      aria-label="Previous month"
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                    </button>
                    <h3 className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                      {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                      className="p-1.5 sm:p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      aria-label="Next month"
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-3 sm:mb-4 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
                      <div key={day} className="h-8 w-8 flex items-center justify-center text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
                        {day}
                      </div>
                    ))}
                    {generateCalendarDays()}
                  </div>

                  <div className="border-t border-border-light dark:border-border-dark pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">Quick Select:</p>
                      <button
                        onClick={goToToday}
                        className="px-2 py-1 text-xs bg-brand-blue hover:bg-brand-dark-blue text-white rounded transition-colors"
                      >
                        Today
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {quickDateOptions.map(option => (
                        <button
                          key={option.value}
                          onClick={() => handleQuickDateSelect(option.value)}
                          className="px-2 py-1 text-xs bg-background-light dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-text-secondary-light dark:text-text-secondary-dark rounded transition-colors"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="border-t border-border-light dark:border-border-dark pt-3 mt-3 flex items-center justify-between">
                      <span className="text-sm text-text-primary-light dark:text-text-primary-dark">
                        Selected: {formatDisplayDate(selectedDate)}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedDate('');
                          setDateFilter('today');
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                        aria-label="Clear selection"
                      >
                        <X className="h-4 w-4 sm:h-5 sm:w-5 text-text-secondary-light dark:text-text-secondary-dark" />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-text-secondary-light dark:text-text-secondary-dark flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ServiceStatus | 'all')}
                className="block w-full pl-3 pr-10 py-2.5 sm:py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark text-text-primary-light dark:text-text-primary-dark rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-brand-blue text-sm transition-all duration-200"
              >
                <option value="all">All Statuses</option>
                <option value="waiting">Waiting</option>
                <option value="in-progress">In Progress</option>
                <option value="payment-pending">Ready for Payment</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { title: 'Waiting', count: waitingCount, status: 'waiting', color: 'blue' },
          { title: 'In Progress', count: inProgressCount, status: 'in-progress', color: 'sky' },
          { title: 'Payment', count: paymentPendingCount, status: 'payment-pending', color: 'yellow' },
          { title: 'Cancelled', count: cancelledCount, status: 'cancelled', color: 'red' },
          { title: 'Completed', count: completedCount, status: 'completed', color: 'green' },
          { title: 'Total', count: dateFilteredCars.length, status: 'all', color: 'gray' }
        ].map(item => (
          <div 
            key={item.title}
            className={`bg-surface-light dark:bg-surface-dark rounded-lg p-3 sm:p-4 border border-border-light dark:border-border-dark cursor-pointer hover:border-brand-blue dark:hover:border-brand-blue transition-all duration-200 transform hover:scale-105 ${
              item.title === 'Total' ? 'col-span-2 sm:col-span-1' : ''
            }`}
            onClick={() => setStatusFilter(item.status as any)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark truncate">
                  {item.title === 'Total' 
                    ? (dateFilter === 'today' ? 'Total Today' : dateFilter === 'custom' ? 'Total Selected Day' : 'Total All Time')
                    : item.title}
                </p>
                <p className="text-lg sm:text-2xl font-bold text-text-primary-light dark:text-text-primary-dark">{item.count}</p>
              </div>
              <div className={`bg-${item.color}-500/10 rounded-full p-1.5 sm:p-2 flex-shrink-0`}>
                <div className={`h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-${item.color}-500 flex items-center justify-center text-xs font-bold text-white`}>
                  {item.count > 99 ? '99+' : item.count}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="bg-surface-light dark:bg-surface-dark p-6 sm:p-8 text-center rounded-lg border border-border-light dark:border-border-dark">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full mb-4 animate-spin"></div>
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      ) : filteredCars.length > 0 ? (
        <div className="space-y-3 sm:space-y-4">
          {filteredCars.map(car => (
            <QueueItem key={car.id} car={car} />
          ))}
        </div>
      ) : (
        <div className="bg-surface-light dark:bg-surface-dark p-6 sm:p-8 text-center rounded-lg border border-border-light dark:border-border-dark">
          <div className="flex flex-col items-center">
            <Search className="h-12 w-12 text-text-secondary-light dark:text-text-secondary-dark mb-4 opacity-50" />
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm sm:text-base">
              No vehicles match the current criteria
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueList;
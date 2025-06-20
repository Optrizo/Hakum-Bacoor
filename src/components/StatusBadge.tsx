import React from 'react';
import { ServiceStatus } from '../../types';

interface StatusBadgeProps {
  status: ServiceStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusStyles: { [key in ServiceStatus]: { text: string; bg: string; } } = {
    waiting: { text: 'text-blue-800 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/50' },
    'in-progress': { text: 'text-cyan-800 dark:text-cyan-300', bg: 'bg-cyan-100 dark:bg-cyan-900/50' },
    'payment-pending': { text: 'text-yellow-800 dark:text-yellow-300', bg: 'bg-yellow-100 dark:bg-yellow-900/50' },
    completed: { text: 'text-green-800 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/50' },
    cancelled: { text: 'text-red-800 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/50' },
  };

  const { text, bg } = statusStyles[status] || { text: 'text-gray-800 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-700' };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}
    >
      {status.replace('-', ' ')}
    </span>
  );
};

export default StatusBadge;
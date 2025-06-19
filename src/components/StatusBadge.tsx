import React from 'react';
import { ServiceStatus } from '../types';

interface StatusBadgeProps {
  status: ServiceStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'waiting':
        return {
          text: 'Waiting',
          bgColor: 'bg-[#116AF8]/20',
          textColor: 'text-[#116AF8]',
          borderColor: 'border-[#116AF8]/30'
        };
      case 'in-progress':
        return {
          text: 'In Progress',
          bgColor: 'bg-[#20BCED]/20',
          textColor: 'text-[#20BCED]',
          borderColor: 'border-[#20BCED]/30'
        };
      case 'completed':
        return {
          text: 'Completed',
          bgColor: 'bg-green-500/20',
          textColor: 'text-green-400',
          borderColor: 'border-green-500/30'
        };
      case 'payment-pending':
        return {
          text: 'Ready for Payment',
          bgColor: 'bg-[#116AF8]/20',
          textColor: 'text-[#116AF8]',
          borderColor: 'border-[#116AF8]/30'
        };
      case 'cancelled':
        return {
          text: 'Cancelled',
          bgColor: 'bg-[#878EA0]/20',
          textColor: 'text-[#878EA0]',
          borderColor: 'border-[#878EA0]/30'
        };
      default:
        return {
          text: status,
          bgColor: 'bg-[#878EA0]/20',
          textColor: 'text-[#878EA0]',
          borderColor: 'border-[#878EA0]/30'
        };
    }
  };

  const { text, bgColor, textColor, borderColor } = getStatusConfig();

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full border ${bgColor} ${textColor} ${borderColor}`}>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
};

export default StatusBadge;
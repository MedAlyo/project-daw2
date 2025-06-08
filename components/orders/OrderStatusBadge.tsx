import React from 'react';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-orange-100 text-orange-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-purple-100 text-purple-800',
  refunded: 'bg-gray-100 text-gray-800',
};

interface OrderStatusBadgeProps {
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'completed' | 'refunded';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded ${statusColors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};
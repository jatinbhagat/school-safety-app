'use client';

interface StatusBadgeProps {
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'pending' | 'triaged' | 'assigned';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'open':
      case 'pending':
        return {
          label: 'NEW',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          icon: '🔴',
          borderColor: 'border-red-300',
        };
      case 'triaged':
        return {
          label: 'TRIAGED',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          icon: '🔵',
          borderColor: 'border-blue-300',
        };
      case 'in_progress':
      case 'assigned':
        return {
          label: 'IN PROGRESS',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-800',
          icon: '🟡',
          borderColor: 'border-amber-300',
        };
      case 'resolved':
        return {
          label: 'RESOLVED',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          icon: '✅',
          borderColor: 'border-green-300',
        };
      case 'closed':
        return {
          label: 'CLOSED',
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: '⚫',
          borderColor: 'border-gray-300',
        };
      default:
        return {
          label: status.toUpperCase(),
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          icon: '⚪',
          borderColor: 'border-gray-300',
        };
    }
  };

  const config = getStatusConfig();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses[size]}`}
    >
      <span className="text-xs">{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}

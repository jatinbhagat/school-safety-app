'use client';

interface PriorityIndicatorProps {
  priority: 'critical' | 'high' | 'medium' | 'low';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function PriorityIndicator({ priority, size = 'md', showLabel = true }: PriorityIndicatorProps) {
  const getConfig = () => {
    switch (priority) {
      case 'critical':
        return {
          label: 'CRITICAL',
          icon: '🔴',
          textColor: 'text-red-600',
          bgColor: 'bg-red-100',
          dotColor: 'bg-red-600',
        };
      case 'high':
        return {
          label: 'HIGH',
          icon: '🔴',
          textColor: 'text-red-500',
          bgColor: 'bg-red-50',
          dotColor: 'bg-red-500',
        };
      case 'medium':
        return {
          label: 'MEDIUM',
          icon: '🟠',
          textColor: 'text-orange-600',
          bgColor: 'bg-orange-50',
          dotColor: 'bg-orange-500',
        };
      case 'low':
        return {
          label: 'LOW',
          icon: '🔵',
          textColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          dotColor: 'bg-blue-500',
        };
      default:
        return {
          label: String(priority).toUpperCase(),
          icon: '⚪',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          dotColor: 'bg-gray-400',
        };
    }
  };

  const config = getConfig();

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const dotSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} font-medium ${config.textColor}`}>
      <span className={`rounded-full ${config.dotColor} ${dotSizeClasses[size]} inline-block`} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );
}

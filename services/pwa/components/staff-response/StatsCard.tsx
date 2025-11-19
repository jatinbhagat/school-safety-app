'use client';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: string;
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'red';
  subtitle?: string;
}

export function StatsCard({ title, value, icon, color = 'blue', subtitle }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-3xl font-bold">{value}</span>
      </div>
      <h3 className="text-sm font-medium mb-0.5">{title}</h3>
      {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
    </div>
  );
}

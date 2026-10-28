import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
  iconBgColor: string;
  iconColor: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBgColor,
  iconColor
}) => {
  return (
    <div className="bg-bg-card border border-border-card rounded-2xl p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBgColor} ${iconColor} transition-transform group-hover:scale-110`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm font-semibold text-gray-200">{title}</div>
        <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
      </div>
    </div>
  );
};

export default MetricCard;

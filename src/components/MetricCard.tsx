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
    <div className="bg-bg-card border border-border-card rounded-2xl p-4 sm:p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-shadow group min-w-0 overflow-hidden">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgColor} ${iconColor} transition-transform group-hover:scale-110`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl sm:text-3xl font-bold text-white mb-1 break-words">{value}</div>
        <div className="text-sm font-semibold text-gray-200 break-words">{title}</div>
        <div className="text-xs text-gray-500 mt-1 break-words">{subtitle}</div>
      </div>
    </div>
  );
};

export default MetricCard;


import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
  className?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  value, 
  icon, 
  color = "bg-edu-primary",
  className,
  trend 
}) => {
  return (
    <div className={cn(
      "p-6 rounded-lg shadow-sm border border-gray-100 bg-white edu-card-hover",
      className
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold mt-2">{value}</h3>
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={cn(
                "text-xs font-medium",
                trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
              )}>
                {trend.direction === 'up' ? '↑' : '↓'} {trend.value}%
              </span>
              <span className="ml-1 text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        
        {icon && (
          <div className={cn(
            "p-3 rounded-full", 
            color === "bg-edu-primary" ? "bg-edu-primary/10 text-edu-primary" : color
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardCard;

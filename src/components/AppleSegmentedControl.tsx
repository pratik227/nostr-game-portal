
import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

interface AppleSegmentedControlProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function AppleSegmentedControl({ tabs, activeTab, onTabChange, className }: AppleSegmentedControlProps) {
  return (
    <div className={cn("relative bg-gray-100 rounded-xl p-1 flex", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out",
            "flex items-center justify-center gap-2",
            activeTab === tab.id
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span className={cn(
              "ml-1 px-1.5 py-0.5 text-xs rounded-full",
              activeTab === tab.id
                ? "bg-gray-100 text-gray-600"
                : "bg-gray-200 text-gray-500"
            )}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}


import React from 'react';
import { Check } from 'lucide-react';

interface CircleColorPickerProps {
  selectedColor?: string | null;
  onColorSelect: (color: string) => void;
  className?: string;
}

const CIRCLE_COLORS = [
  { name: 'Teal', value: '#14b8a6', bg: 'bg-teal-500' },
  { name: 'Blue', value: '#3b82f6', bg: 'bg-blue-500' },
  { name: 'Purple', value: '#8b5cf6', bg: 'bg-purple-500' },
  { name: 'Pink', value: '#ec4899', bg: 'bg-pink-500' },
  { name: 'Orange', value: '#f97316', bg: 'bg-orange-500' },
  { name: 'Green', value: '#22c55e', bg: 'bg-green-500' },
  { name: 'Red', value: '#ef4444', bg: 'bg-red-500' },
  { name: 'Gray', value: '#6b7280', bg: 'bg-gray-500' },
];

export function CircleColorPicker({ selectedColor, onColorSelect, className = '' }: CircleColorPickerProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <label className="text-sm font-medium text-gray-700">Circle Color</label>
      <div className="grid grid-cols-4 gap-3">
        {CIRCLE_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => onColorSelect(color.value)}
            className={`
              relative w-10 h-10 rounded-full transition-all duration-200 
              ${color.bg} hover:scale-110 hover:shadow-lg
              ${selectedColor === color.value ? 'ring-2 ring-gray-900 ring-offset-2' : ''}
            `}
            title={color.name}
          >
            {selectedColor === color.value && (
              <Check className="w-5 h-5 text-white absolute inset-0 m-auto" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

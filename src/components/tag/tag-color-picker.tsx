'use client';

import React from 'react';
import { Check } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Predefined color palette for tags
const TAG_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#6b7280', // gray
  '#84cc16', // lime
  '#f59e0b', // amber
  '#10b981', // emerald
  '#0ea5e9', // sky
  '#6366f1', // indigo
  '#a855f7', // purple
  '#e11d48', // rose
];

interface TagColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  disabled?: boolean;
}

export function TagColorPicker({ 
  selectedColor, 
  onColorChange, 
  disabled = false 
}: TagColorPickerProps) {
  const [customColor, setCustomColor] = React.useState(selectedColor);

  const handlePresetColorClick = (color: string) => {
    onColorChange(color);
    setCustomColor(color);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setCustomColor(color);
    onColorChange(color);
  };

  return (
    <div className="space-y-3">
      {/* Preset Colors */}
      <div className="grid grid-cols-8 gap-2">
        {TAG_COLORS.map((color) => (
          <Button
            key={color}
            type="button"
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 border-2 hover:scale-110 transition-transform"
            style={{
              backgroundColor: color,
              borderColor: selectedColor === color ? '#000' : 'transparent',
            }}
            onClick={() => handlePresetColorClick(color)}
            disabled={disabled}
          >
            {selectedColor === color && (
              <Check className="h-4 w-4 text-white drop-shadow-sm" />
            )}
          </Button>
        ))}
      </div>

      {/* Custom Color Input */}
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={customColor}
          onChange={handleCustomColorChange}
          className="w-12 h-8 p-0 border-0 cursor-pointer"
          disabled={disabled}
        />
        <Input
          type="text"
          value={customColor}
          onChange={(e) => {
            setCustomColor(e.target.value);
            // Only update if it's a valid hex color
            if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
              onColorChange(e.target.value);
            }
          }}
          placeholder="#000000"
          className="flex-1 font-mono text-sm"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
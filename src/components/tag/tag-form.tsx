'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { Tag } from '@/lib/types';
import { TagColorPicker } from './tag-color-picker';

// Form validation schema
const tagFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name must be 50 characters or less')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Tag name can only contain letters, numbers, spaces, hyphens, and underscores'),
  color: z.string().optional(),
});

type TagFormData = z.infer<typeof tagFormSchema>;

interface TagFormProps {
  tag?: Tag;
  onSubmit: (data: { name: string; color?: string }) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TagForm({ tag, onSubmit, onCancel, isLoading = false }: TagFormProps) {
  const [selectedColor, setSelectedColor] = useState(tag?.color || '#6b7280');

  const form = useForm<TagFormData>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: tag?.name || '',
      color: tag?.color || '#6b7280',
    },
  });

  const handleSubmit = async (data: TagFormData) => {
    try {
      await onSubmit({
        name: data.name.trim(),
        color: selectedColor,
      });
    } catch (error) {
      console.error('Form submission error:', error);
      form.setError('root', {
        type: 'manual',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tag Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter tag name"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Color</Label>
          <TagColorPicker
            selectedColor={selectedColor}
            onColorChange={setSelectedColor}
            disabled={isLoading}
          />
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="font-medium">
              {form.watch('name') || 'Tag Name'}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : tag ? 'Update Tag' : 'Create Tag'}
          </Button>
        </div>

        {form.formState.errors.root && (
          <div className="text-destructive text-sm mt-2">
            {form.formState.errors.root.message}
          </div>
        )}
      </form>
    </Form>
  );
}
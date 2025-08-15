import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TagForm } from '../tag-form';
import { Tag } from '@/lib/types';

describe('TagForm', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    onCancel: vi.fn(),
  };

  const mockTag: Tag = {
    id: '1',
    name: 'Italian',
    count: 5,
    color: '#ef4444',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render form for creating new tag', () => {
      render(<TagForm {...defaultProps} />);

      expect(screen.getByText('Tag Name *')).toBeInTheDocument();
      expect(screen.getByText('Color')).toBeInTheDocument();
      expect(screen.getByText('Preview')).toBeInTheDocument();
      expect(screen.getByText('Create Tag')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render form for editing existing tag', () => {
      render(<TagForm {...defaultProps} tag={mockTag} />);

      expect(screen.getByDisplayValue('Italian')).toBeInTheDocument();
      expect(screen.getByText('Update Tag')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<TagForm {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Saving...')).toBeInTheDocument();
      
      const nameInput = screen.getByPlaceholderText('Enter tag name');
      expect(nameInput).toBeDisabled();
    });
  });

  describe('form validation', () => {
    it('should show error for empty tag name', async () => {
      const user = userEvent.setup();
      render(<TagForm {...defaultProps} />);

      const submitButton = screen.getByText('Create Tag');
      await user.click(submitButton);

      expect(screen.getByText('Tag name is required')).toBeInTheDocument();
    });

    it('should show error for tag name that is too long', async () => {
      const user = userEvent.setup();
      render(<TagForm {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Enter tag name');
      await user.type(nameInput, 'a'.repeat(51)); // 51 characters

      const submitButton = screen.getByText('Create Tag');
      await user.click(submitButton);

      expect(screen.getByText('Tag name must be 50 characters or less')).toBeInTheDocument();
    });

    it('should show error for invalid characters in tag name', async () => {
      const user = userEvent.setup();
      render(<TagForm {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Enter tag name');
      await user.type(nameInput, 'Invalid@Tag!');

      const submitButton = screen.getByText('Create Tag');
      await user.click(submitButton);

      expect(screen.getByText('Tag name can only contain letters, numbers, spaces, hyphens, and underscores')).toBeInTheDocument();
    });

    it('should accept valid tag names', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      
      render(<TagForm {...defaultProps} onSubmit={onSubmit} />);

      const nameInput = screen.getByPlaceholderText('Enter tag name');
      await user.type(nameInput, 'Valid-Tag_123');

      const submitButton = screen.getByText('Create Tag');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'Valid-Tag_123',
          color: expect.any(String),
        });
      });
    });
  });

  describe('color selection', () => {
    it('should allow selecting preset colors', async () => {
      const user = userEvent.setup();
      render(<TagForm {...defaultProps} />);

      // Find and click a preset color button
      const colorButtons = screen.getAllByRole('button');
      const redColorButton = colorButtons.find(button => 
        button.style.backgroundColor === 'rgb(239, 68, 68)' // #ef4444
      );

      if (redColorButton) {
        await user.click(redColorButton);
      }

      // Check if the preview updates
      const previewDot = screen.getByRole('generic', { hidden: true });
      expect(previewDot).toHaveStyle({ backgroundColor: '#ef4444' });
    });

    it('should allow custom color input', async () => {
      const user = userEvent.setup();
      render(<TagForm {...defaultProps} />);

      const customColorInput = screen.getByDisplayValue('#6b7280'); // Default color
      await user.clear(customColorInput);
      await user.type(customColorInput, '#123456');

      // Check if the preview updates
      const previewDot = screen.getByRole('generic', { hidden: true });
      expect(previewDot).toHaveStyle({ backgroundColor: '#123456' });
    });

    it('should sync color picker and text input', async () => {
      const user = userEvent.setup();
      render(<TagForm {...defaultProps} />);

      const colorPicker = screen.getByDisplayValue('#6b7280');
      await user.clear(colorPicker);
      await user.type(colorPicker, '#ff0000');

      // Both inputs should have the same value
      const textInputs = screen.getAllByDisplayValue('#ff0000');
      expect(textInputs).toHaveLength(2); // Color picker and text input
    });
  });

  describe('preview functionality', () => {
    it('should show preview with tag name and color', async () => {
      const user = userEvent.setup();
      render(<TagForm {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Enter tag name');
      await user.type(nameInput, 'Test Tag');

      expect(screen.getByText('Test Tag')).toBeInTheDocument();
    });

    it('should show default preview text when name is empty', () => {
      render(<TagForm {...defaultProps} />);

      expect(screen.getByText('Tag Name')).toBeInTheDocument();
    });

    it('should update preview color when color changes', async () => {
      const user = userEvent.setup();
      render(<TagForm {...defaultProps} />);

      const customColorInput = screen.getAllByDisplayValue('#6b7280')[1]; // Text input
      await user.clear(customColorInput);
      await user.type(customColorInput, '#ff0000');

      const previewDot = screen.getByRole('generic', { hidden: true });
      expect(previewDot).toHaveStyle({ backgroundColor: '#ff0000' });
    });
  });

  describe('form submission', () => {
    it('should call onSubmit with correct data', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      
      render(<TagForm {...defaultProps} onSubmit={onSubmit} />);

      const nameInput = screen.getByPlaceholderText('Enter tag name');
      await user.type(nameInput, 'New Tag');

      const submitButton = screen.getByText('Create Tag');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'New Tag',
          color: '#6b7280', // Default color
        });
      });
    });

    it('should trim whitespace from tag name', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      
      render(<TagForm {...defaultProps} onSubmit={onSubmit} />);

      const nameInput = screen.getByPlaceholderText('Enter tag name');
      await user.type(nameInput, '  Spaced Tag  ');

      const submitButton = screen.getByText('Create Tag');
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith({
          name: 'Spaced Tag',
          color: expect.any(String),
        });
      });
    });

    it('should handle submission error', async () => {
      const user = userEvent.setup();
      const error = new Error('Submission failed');
      const onSubmit = vi.fn().mockRejectedValue(error);
      
      render(<TagForm {...defaultProps} onSubmit={onSubmit} />);

      const nameInput = screen.getByPlaceholderText('Enter tag name');
      await user.type(nameInput, 'Test Tag');

      const submitButton = screen.getByText('Create Tag');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Submission failed')).toBeInTheDocument();
      });
    });

    it('should disable form during submission', async () => {
      const user = userEvent.setup();
      render(<TagForm {...defaultProps} isLoading={true} />);

      const nameInput = screen.getByPlaceholderText('Enter tag name');
      const submitButton = screen.getByText('Saving...');
      const cancelButton = screen.getByText('Cancel');

      expect(nameInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('form cancellation', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const onCancel = vi.fn();
      
      render(<TagForm {...defaultProps} onCancel={onCancel} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('editing existing tag', () => {
    it('should populate form with existing tag data', () => {
      render(<TagForm {...defaultProps} tag={mockTag} />);

      expect(screen.getByDisplayValue('Italian')).toBeInTheDocument();
      
      // Check if color is set correctly
      const colorInputs = screen.getAllByDisplayValue('#ef4444');
      expect(colorInputs.length).toBeGreaterThan(0);
    });

    it('should show update button text when editing', () => {
      render(<TagForm {...defaultProps} tag={mockTag} />);

      expect(screen.getByText('Update Tag')).toBeInTheDocument();
      expect(screen.queryByText('Create Tag')).not.toBeInTheDocument();
    });

    it('should show existing tag name in preview', () => {
      render(<TagForm {...defaultProps} tag={mockTag} />);

      expect(screen.getByText('Italian')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper labels for form fields', () => {
      render(<TagForm {...defaultProps} />);

      expect(screen.getByLabelText('Tag Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Color')).toBeInTheDocument();
    });

    it('should show required indicator for tag name', () => {
      render(<TagForm {...defaultProps} />);

      expect(screen.getByText('Tag Name *')).toBeInTheDocument();
    });

    it('should associate error messages with form fields', async () => {
      const user = userEvent.setup();
      render(<TagForm {...defaultProps} />);

      const submitButton = screen.getByText('Create Tag');
      await user.click(submitButton);

      const errorMessage = screen.getByText('Tag name is required');
      expect(errorMessage).toBeInTheDocument();
    });
  });
});
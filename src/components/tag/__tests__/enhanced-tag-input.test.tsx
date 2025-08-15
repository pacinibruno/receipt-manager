import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { EnhancedTagInput } from '../enhanced-tag-input';
import { useTags } from '@/hooks/use-tags';
import { Tag } from '@/lib/types';

// Mock the useTags hook
vi.mock('@/hooks/use-tags');

const mockTags: Tag[] = [
  { id: '1', name: 'Italian', count: 5, color: '#ef4444' },
  { id: '2', name: 'Vegetarian', count: 3, color: '#22c55e' },
  { id: '3', name: 'Quick', count: 8, color: '#3b82f6' },
  { id: '4', name: 'Dessert', count: 2, color: '#ec4899' },
];

const mockUseTagsReturn = {
  tags: mockTags,
  loading: false,
  error: null,
  tagStats: {
    totalTags: 4,
    mostUsedTags: [],
    recentlyUsedTags: [],
    unusedTags: [],
    tagUsageByMonth: [],
  },
  addTag: vi.fn(),
  editTag: vi.fn(),
  removeTag: vi.fn(),
  fetchTags: vi.fn(),
  fetchTag: vi.fn(),
  getSuggestedTags: vi.fn(),
  getPopularTags: vi.fn(() => mockTags.slice(0, 3)),
  refreshTagStats: vi.fn(),
  clearError: vi.fn(),
};

describe('EnhancedTagInput', () => {
  const defaultProps = {
    selectedTags: [],
    onTagsChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useTags as any).mockReturnValue(mockUseTagsReturn);
  });

  describe('rendering', () => {
    it('should render input field with placeholder', () => {
      render(<EnhancedTagInput {...defaultProps} />);

      expect(screen.getByPlaceholderText('Type to add tags...')).toBeInTheDocument();
    });

    it('should render custom placeholder', () => {
      render(<EnhancedTagInput {...defaultProps} placeholder="Custom placeholder" />);

      expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
    });

    it('should render selected tags', () => {
      render(<EnhancedTagInput {...defaultProps} selectedTags={['Italian', 'Quick']} />);

      expect(screen.getByText('Italian')).toBeInTheDocument();
      expect(screen.getByText('Quick')).toBeInTheDocument();
    });

    it('should render popular tags when no tags are selected', () => {
      render(<EnhancedTagInput {...defaultProps} showPopularTags={true} />);

      expect(screen.getByText('Popular tags:')).toBeInTheDocument();
      expect(screen.getByText('Italian')).toBeInTheDocument();
      expect(screen.getByText('Vegetarian')).toBeInTheDocument();
      expect(screen.getByText('Quick')).toBeInTheDocument();
    });

    it('should not render popular tags when tags are selected', () => {
      render(
        <EnhancedTagInput 
          {...defaultProps} 
          selectedTags={['Italian']} 
          showPopularTags={true} 
        />
      );

      expect(screen.queryByText('Popular tags:')).not.toBeInTheDocument();
    });

    it('should not render popular tags when showPopularTags is false', () => {
      render(<EnhancedTagInput {...defaultProps} showPopularTags={false} />);

      expect(screen.queryByText('Popular tags:')).not.toBeInTheDocument();
    });
  });

  describe('tag suggestions', () => {
    it('should show suggestions when typing', async () => {
      const user = userEvent.setup();
      mockUseTagsReturn.getSuggestedTags.mockReturnValue([mockTags[0]]); // Italian

      render(<EnhancedTagInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.type(input, 'ital');

      expect(mockUseTagsReturn.getSuggestedTags).toHaveBeenCalledWith('ital', []);
      expect(screen.getByText('Italian')).toBeInTheDocument();
      expect(screen.getByText('5 recipes')).toBeInTheDocument();
    });

    it('should hide suggestions when input is empty', async () => {
      const user = userEvent.setup();
      mockUseTagsReturn.getSuggestedTags.mockReturnValue([]);

      render(<EnhancedTagInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.type(input, 'test');
      await user.clear(input);

      expect(screen.queryByText('Italian')).not.toBeInTheDocument();
    });

    it('should show create option for custom tags', async () => {
      const user = userEvent.setup();
      mockUseTagsReturn.getSuggestedTags.mockReturnValue([]);

      render(<EnhancedTagInput {...defaultProps} allowCustomTags={true} />);

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.type(input, 'NewTag');

      expect(screen.getByText('Create "NewTag"')).toBeInTheDocument();
    });

    it('should not show create option when allowCustomTags is false', async () => {
      const user = userEvent.setup();
      mockUseTagsReturn.getSuggestedTags.mockReturnValue([]);

      render(<EnhancedTagInput {...defaultProps} allowCustomTags={false} />);

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.type(input, 'NewTag');

      expect(screen.queryByText('Create "NewTag"')).not.toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('should add tag on Enter key', async () => {
      const user = userEvent.setup();
      const onTagsChange = vi.fn();
      mockUseTagsReturn.getSuggestedTags.mockReturnValue([mockTags[0]]);

      render(<EnhancedTagInput {...defaultProps} onTagsChange={onTagsChange} />);

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.type(input, 'ital');
      await user.keyboard('{Enter}');

      expect(onTagsChange).toHaveBeenCalledWith(['Italian']);
    });

    it('should navigate suggestions with arrow keys', async () => {
      const user = userEvent.setup();
      mockUseTagsReturn.getSuggestedTags.mockReturnValue([mockTags[0], mockTags[1]]);

      render(<EnhancedTagInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.type(input, 'test');
      
      // Navigate down
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      
      // The second suggestion should be highlighted
      const suggestions = screen.getAllByRole('button');
      expect(suggestions[1]).toHaveClass('bg-accent');
    });

    it('should remove last tag on backspace when input is empty', async () => {
      const user = userEvent.setup();
      const onTagsChange = vi.fn();

      render(
        <EnhancedTagInput 
          {...defaultProps} 
          selectedTags={['Italian', 'Quick']} 
          onTagsChange={onTagsChange} 
        />
      );

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.click(input);
      await user.keyboard('{Backspace}');

      expect(onTagsChange).toHaveBeenCalledWith(['Italian']);
    });

    it('should hide suggestions on Escape key', async () => {
      const user = userEvent.setup();
      mockUseTagsReturn.getSuggestedTags.mockReturnValue([mockTags[0]]);

      render(<EnhancedTagInput {...defaultProps} />);

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.type(input, 'ital');
      
      expect(screen.getByText('Italian')).toBeInTheDocument();
      
      await user.keyboard('{Escape}');
      
      expect(screen.queryByText('Italian')).not.toBeInTheDocument();
    });
  });

  describe('tag management', () => {
    it('should add tag when suggestion is clicked', async () => {
      const user = userEvent.setup();
      const onTagsChange = vi.fn();
      mockUseTagsReturn.getSuggestedTags.mockReturnValue([mockTags[0]]);

      render(<EnhancedTagInput {...defaultProps} onTagsChange={onTagsChange} />);

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.type(input, 'ital');

      const suggestion = screen.getByText('Italian');
      await user.click(suggestion);

      expect(onTagsChange).toHaveBeenCalledWith(['Italian']);
    });

    it('should add tag when popular tag is clicked', async () => {
      const user = userEvent.setup();
      const onTagsChange = vi.fn();

      render(
        <EnhancedTagInput 
          {...defaultProps} 
          onTagsChange={onTagsChange} 
          showPopularTags={true} 
        />
      );

      const popularTag = screen.getByText('Italian');
      await user.click(popularTag);

      expect(onTagsChange).toHaveBeenCalledWith(['Italian']);
    });

    it('should remove tag when X button is clicked', async () => {
      const user = userEvent.setup();
      const onTagsChange = vi.fn();

      render(
        <EnhancedTagInput 
          {...defaultProps} 
          selectedTags={['Italian', 'Quick']} 
          onTagsChange={onTagsChange} 
        />
      );

      // Find and click the X button for Italian tag
      const removeButtons = screen.getAllByRole('button');
      const italianRemoveButton = removeButtons.find(button => 
        button.closest('[class*="badge"]')?.textContent?.includes('Italian')
      );
      
      if (italianRemoveButton) {
        await user.click(italianRemoveButton);
      }

      expect(onTagsChange).toHaveBeenCalledWith(['Quick']);
    });

    it('should not add duplicate tags', async () => {
      const user = userEvent.setup();
      const onTagsChange = vi.fn();
      mockUseTagsReturn.getSuggestedTags.mockReturnValue([mockTags[0]]);

      render(
        <EnhancedTagInput 
          {...defaultProps} 
          selectedTags={['Italian']} 
          onTagsChange={onTagsChange} 
        />
      );

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.type(input, 'ital');
      await user.keyboard('{Enter}');

      expect(onTagsChange).not.toHaveBeenCalled();
    });

    it('should respect maxTags limit', async () => {
      const user = userEvent.setup();
      const onTagsChange = vi.fn();
      mockUseTagsReturn.getSuggestedTags.mockReturnValue([mockTags[0]]);

      render(
        <EnhancedTagInput 
          {...defaultProps} 
          selectedTags={['Quick', 'Dessert']} 
          onTagsChange={onTagsChange} 
          maxTags={2}
        />
      );

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.type(input, 'ital');
      await user.keyboard('{Enter}');

      expect(onTagsChange).not.toHaveBeenCalled();
      expect(screen.getByText('Maximum of 2 tags allowed.')).toBeInTheDocument();
    });
  });

  describe('custom tag creation', () => {
    it('should create custom tag when allowCustomTags is true', async () => {
      const user = userEvent.setup();
      const onTagsChange = vi.fn();
      mockUseTagsReturn.getSuggestedTags.mockReturnValue([]);
      mockUseTagsReturn.addTag.mockResolvedValue({ id: '5', name: 'NewTag', count: 0 });

      render(
        <EnhancedTagInput 
          {...defaultProps} 
          onTagsChange={onTagsChange} 
          allowCustomTags={true} 
        />
      );

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.type(input, 'NewTag');

      const createButton = screen.getByText('Create "NewTag"');
      await user.click(createButton);

      await waitFor(() => {
        expect(mockUseTagsReturn.addTag).toHaveBeenCalledWith({ name: 'NewTag' });
        expect(onTagsChange).toHaveBeenCalledWith(['NewTag']);
      });
    });

    it('should handle custom tag creation error', async () => {
      const user = userEvent.setup();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockUseTagsReturn.getSuggestedTags.mockReturnValue([]);
      mockUseTagsReturn.addTag.mockRejectedValue(new Error('Creation failed'));

      render(
        <EnhancedTagInput 
          {...defaultProps} 
          allowCustomTags={true} 
        />
      );

      const input = screen.getByPlaceholderText('Type to add tags...');
      await user.type(input, 'NewTag');

      const createButton = screen.getByText('Create "NewTag"');
      await user.click(createButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to add custom tag:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('disabled state', () => {
    it('should disable input when disabled prop is true', () => {
      render(<EnhancedTagInput {...defaultProps} disabled={true} />);

      const input = screen.getByPlaceholderText('Type to add tags...');
      expect(input).toBeDisabled();
    });

    it('should not show remove buttons when disabled', () => {
      render(
        <EnhancedTagInput 
          {...defaultProps} 
          selectedTags={['Italian']} 
          disabled={true} 
        />
      );

      const removeButtons = screen.queryAllByRole('button');
      expect(removeButtons).toHaveLength(0);
    });

    it('should disable popular tag buttons when disabled', () => {
      render(
        <EnhancedTagInput 
          {...defaultProps} 
          disabled={true} 
          showPopularTags={true} 
        />
      );

      const popularTagButtons = screen.getAllByRole('button');
      popularTagButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  describe('tag colors', () => {
    it('should display tag colors correctly', () => {
      render(<EnhancedTagInput {...defaultProps} selectedTags={['Italian']} />);

      const colorDot = screen.getByRole('generic', { hidden: true });
      expect(colorDot).toHaveStyle({ backgroundColor: '#ef4444' });
    });

    it('should use default color for tags without color', () => {
      const tagWithoutColor = { ...mockTags[0], color: undefined };
      (useTags as any).mockReturnValue({
        ...mockUseTagsReturn,
        tags: [tagWithoutColor],
      });

      render(<EnhancedTagInput {...defaultProps} selectedTags={['Italian']} />);

      const colorDot = screen.getByRole('generic', { hidden: true });
      expect(colorDot).toHaveStyle({ backgroundColor: '#6b7280' });
    });
  });
});
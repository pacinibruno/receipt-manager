import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TagManagement } from '../tag-management';
import { useTags } from '@/hooks/use-tags';
import { Tag } from '@/lib/types';

// Mock the useTags hook
vi.mock('@/hooks/use-tags');

const mockTags: Tag[] = [
  { id: '1', name: 'Italian', count: 5, color: '#ef4444' },
  { id: '2', name: 'Vegetarian', count: 3, color: '#22c55e' },
  { id: '3', name: 'Quick', count: 8, color: '#3b82f6' },
  { id: '4', name: 'Dessert', count: 2, color: '#ec4899' },
  { id: '5', name: 'Unused', count: 0, color: '#6b7280' },
];

const mockTagStats = {
  totalTags: 5,
  mostUsedTags: [
    { id: '3', name: 'Quick', count: 8, color: '#3b82f6' },
    { id: '1', name: 'Italian', count: 5, color: '#ef4444' },
    { id: '2', name: 'Vegetarian', count: 3, color: '#22c55e' },
  ],
  recentlyUsedTags: [
    { id: '3', name: 'Quick', count: 8, color: '#3b82f6' },
    { id: '1', name: 'Italian', count: 5, color: '#ef4444' },
  ],
  unusedTags: [
    { id: '5', name: 'Unused', count: 0, color: '#6b7280' },
  ],
  tagUsageByMonth: [
    { month: 'Jan 2024', count: 3 },
    { month: 'Feb 2024', count: 5 },
    { month: 'Mar 2024', count: 2 },
  ],
};

const mockUseTagsReturn = {
  tags: mockTags,
  loading: false,
  error: null,
  tagStats: mockTagStats,
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

describe('TagManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useTags as any).mockReturnValue(mockUseTagsReturn);
  });

  describe('rendering', () => {
    it('should render tag management interface', () => {
      render(<TagManagement />);

      expect(screen.getByText('Tag Management')).toBeInTheDocument();
      expect(screen.getByText('Add Tag')).toBeInTheDocument();
      expect(screen.getByText('Manage Tags')).toBeInTheDocument();
      expect(screen.getByText('Statistics')).toBeInTheDocument();
    });

    it('should render all tags in the list', () => {
      render(<TagManagement />);

      mockTags.forEach(tag => {
        expect(screen.getByText(tag.name)).toBeInTheDocument();
        expect(screen.getByText(`Used in ${tag.count} recipe${tag.count !== 1 ? 's' : ''}`)).toBeInTheDocument();
      });
    });

    it('should render popular tags section', () => {
      render(<TagManagement />);

      expect(screen.getByText('Popular Tags')).toBeInTheDocument();
      
      // Should show top 3 popular tags
      expect(screen.getByText('Quick (8)')).toBeInTheDocument();
      expect(screen.getByText('Italian (5)')).toBeInTheDocument();
      expect(screen.getByText('Vegetarian (3)')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      (useTags as any).mockReturnValue({
        ...mockUseTagsReturn,
        loading: true,
      });

      render(<TagManagement />);

      expect(screen.getByText('Loading tags...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      const errorMessage = 'Failed to load tags';
      (useTags as any).mockReturnValue({
        ...mockUseTagsReturn,
        error: errorMessage,
      });

      render(<TagManagement />);

      expect(screen.getByText(`Error loading tags: ${errorMessage}`)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  describe('search functionality', () => {
    it('should filter tags based on search query', async () => {
      const user = userEvent.setup();
      render(<TagManagement />);

      const searchInput = screen.getByPlaceholderText('Search tags...');
      await user.type(searchInput, 'ital');

      // Should show Italian tag
      expect(screen.getByText('Italian')).toBeInTheDocument();
      
      // Should not show other tags
      expect(screen.queryByText('Quick')).not.toBeInTheDocument();
      expect(screen.queryByText('Vegetarian')).not.toBeInTheDocument();
    });

    it('should show no results message when search yields no results', async () => {
      const user = userEvent.setup();
      render(<TagManagement />);

      const searchInput = screen.getByPlaceholderText('Search tags...');
      await user.type(searchInput, 'nonexistent');

      expect(screen.getByText('No tags found matching your search.')).toBeInTheDocument();
    });
  });

  describe('sorting functionality', () => {
    it('should sort tags by usage count by default', () => {
      render(<TagManagement />);

      const tagElements = screen.getAllByText(/Used in \d+ recipe/);
      
      // Should be sorted by count (descending)
      expect(tagElements[0]).toHaveTextContent('Used in 8 recipes'); // Quick
      expect(tagElements[1]).toHaveTextContent('Used in 5 recipes'); // Italian
      expect(tagElements[2]).toHaveTextContent('Used in 3 recipes'); // Vegetarian
    });

    it('should sort tags by name when name button is clicked', async () => {
      const user = userEvent.setup();
      render(<TagManagement />);

      const nameButton = screen.getByText('Name');
      await user.click(nameButton);

      // Tags should be sorted alphabetically
      const tagNames = screen.getAllByText(/^[A-Z]/);
      const sortedNames = tagNames.map(el => el.textContent).sort();
      
      expect(tagNames.map(el => el.textContent)).toEqual(sortedNames);
    });
  });

  describe('tag operations', () => {
    it('should open add tag dialog when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<TagManagement />);

      const addButton = screen.getByText('Add Tag');
      await user.click(addButton);

      expect(screen.getByText('Add New Tag')).toBeInTheDocument();
    });

    it('should call addTag when form is submitted', async () => {
      const user = userEvent.setup();
      render(<TagManagement />);

      // Open add dialog
      const addButton = screen.getByText('Add Tag');
      await user.click(addButton);

      // Fill form
      const nameInput = screen.getByPlaceholderText('Enter tag name');
      await user.type(nameInput, 'New Tag');

      // Submit form
      const createButton = screen.getByText('Create Tag');
      await user.click(createButton);

      expect(mockUseTagsReturn.addTag).toHaveBeenCalledWith({
        name: 'New Tag',
        color: expect.any(String),
      });
    });

    it('should open edit dialog when edit button is clicked', async () => {
      const user = userEvent.setup();
      render(<TagManagement />);

      // Click edit button for first tag
      const editButtons = screen.getAllByLabelText(/edit/i);
      await user.click(editButtons[0]);

      expect(screen.getByText('Edit Tag')).toBeInTheDocument();
    });

    it('should call removeTag when delete button is clicked and confirmed', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
      
      render(<TagManagement />);

      // Click delete button for first tag
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      expect(confirmSpy).toHaveBeenCalledWith(
        'Are you sure you want to delete the tag "Quick"? This will remove it from all recipes.'
      );
      expect(mockUseTagsReturn.removeTag).toHaveBeenCalledWith('3'); // Quick tag ID

      confirmSpy.mockRestore();
    });

    it('should not call removeTag when delete is cancelled', async () => {
      const user = userEvent.setup();
      
      // Mock window.confirm to return false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
      
      render(<TagManagement />);

      // Click delete button for first tag
      const deleteButtons = screen.getAllByLabelText(/delete/i);
      await user.click(deleteButtons[0]);

      expect(mockUseTagsReturn.removeTag).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('tag selection', () => {
    it('should call onTagSelect when tag is clicked', async () => {
      const onTagSelect = vi.fn();
      const user = userEvent.setup();
      
      render(<TagManagement onTagSelect={onTagSelect} />);

      // Click on a tag name
      const tagName = screen.getByText('Italian');
      await user.click(tagName);

      expect(onTagSelect).toHaveBeenCalledWith(mockTags[0]);
    });

    it('should highlight selected tags', () => {
      render(<TagManagement selectedTags={['Italian', 'Quick']} />);

      // Selected tags should have primary color class
      const italianTag = screen.getByText('Italian');
      const quickTag = screen.getByText('Quick');
      
      expect(italianTag).toHaveClass('text-primary');
      expect(quickTag).toHaveClass('text-primary');
    });
  });

  describe('statistics tab', () => {
    it('should show statistics when statistics tab is clicked', async () => {
      const user = userEvent.setup();
      render(<TagManagement />);

      const statisticsTab = screen.getByText('Statistics');
      await user.click(statisticsTab);

      // Should show statistics content
      expect(screen.getByText('Total Tags')).toBeInTheDocument();
      
      // Check for the total count in the statistics section
      const totalTagsCard = screen.getByText('Total Tags').closest('div');
      expect(totalTagsCard).toHaveTextContent('5');
    });

    it('should hide statistics tab when showStatistics is false', () => {
      render(<TagManagement showStatistics={false} />);

      expect(screen.queryByText('Statistics')).not.toBeInTheDocument();
    });
  });

  describe('error handling', () => {
    it('should show try again button on error', async () => {
      const user = userEvent.setup();
      (useTags as any).mockReturnValue({
        ...mockUseTagsReturn,
        error: 'Network error',
      });

      render(<TagManagement />);

      const tryAgainButton = screen.getByText('Try Again');
      await user.click(tryAgainButton);

      expect(mockUseTagsReturn.clearError).toHaveBeenCalled();
    });
  });

  describe('empty states', () => {
    it('should show empty state when no tags exist', () => {
      (useTags as any).mockReturnValue({
        ...mockUseTagsReturn,
        tags: [],
        tagStats: {
          ...mockTagStats,
          totalTags: 0,
          mostUsedTags: [],
          recentlyUsedTags: [],
          unusedTags: [],
        },
      });

      render(<TagManagement />);

      expect(screen.getByText('No tags created yet.')).toBeInTheDocument();
    });
  });
});
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { TagManagement } from '../tag-management';
import { useTags } from '@/hooks/use-tags';

// Mock the useTags hook
vi.mock('@/hooks/use-tags');

const mockTags = [
  { id: '1', name: 'Italian', count: 5, color: '#ef4444' },
  { id: '2', name: 'Vegetarian', count: 3, color: '#22c55e' },
  { id: '3', name: 'Quick', count: 8, color: '#3b82f6' },
];

const mockTagStats = {
  totalTags: 3,
  mostUsedTags: mockTags,
  recentlyUsedTags: mockTags.slice(0, 2),
  unusedTags: [],
  tagUsageByMonth: [
    { month: 'Jan 2024', count: 3 },
    { month: 'Feb 2024', count: 5 },
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
  getPopularTags: vi.fn(() => mockTags),
  refreshTagStats: vi.fn(),
  clearError: vi.fn(),
};

describe('Tag Management Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useTags as any).mockReturnValue(mockUseTagsReturn);
  });

  it('should render tag management interface with basic functionality', () => {
    render(<TagManagement />);

    // Check main elements are present
    expect(screen.getByText('Tag Management')).toBeInTheDocument();
    expect(screen.getByText('Add Tag')).toBeInTheDocument();
    
    // Check tags are displayed
    expect(screen.getByText('Italian')).toBeInTheDocument();
    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Quick')).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    const user = userEvent.setup();
    render(<TagManagement />);

    const searchInput = screen.getByPlaceholderText('Search tags...');
    expect(searchInput).toBeInTheDocument();

    // Search should work (though filtering is done client-side)
    await user.type(searchInput, 'Italian');
    expect(searchInput).toHaveValue('Italian');
  });

  it('should show popular tags section', () => {
    render(<TagManagement />);

    expect(screen.getByText('Popular Tags')).toBeInTheDocument();
    
    // Should show tag usage counts
    expect(screen.getByText('Italian (5)')).toBeInTheDocument();
    expect(screen.getByText('Quick (8)')).toBeInTheDocument();
  });

  it('should handle tag operations', async () => {
    const user = userEvent.setup();
    const mockAddTag = vi.fn().mockResolvedValue({ id: '4', name: 'New Tag', count: 0 });
    (useTags as any).mockReturnValue({
      ...mockUseTagsReturn,
      addTag: mockAddTag,
    });

    render(<TagManagement />);

    // Open add tag dialog
    const addButton = screen.getByText('Add Tag');
    await user.click(addButton);

    expect(screen.getByText('Add New Tag')).toBeInTheDocument();
  });

  it('should display statistics when statistics tab is clicked', async () => {
    const user = userEvent.setup();
    render(<TagManagement />);

    const statisticsTab = screen.getByText('Statistics');
    await user.click(statisticsTab);

    // Should show statistics content
    expect(screen.getByText('Total Tags')).toBeInTheDocument();
    expect(screen.getByText('Most Used Tags')).toBeInTheDocument();
  });

  it('should handle error states', () => {
    (useTags as any).mockReturnValue({
      ...mockUseTagsReturn,
      error: 'Test error',
    });

    render(<TagManagement />);

    expect(screen.getByText('Error loading tags: Test error')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should handle loading states', () => {
    (useTags as any).mockReturnValue({
      ...mockUseTagsReturn,
      loading: true,
    });

    render(<TagManagement />);

    expect(screen.getByText('Loading tags...')).toBeInTheDocument();
  });

  it('should handle empty state', () => {
    (useTags as any).mockReturnValue({
      ...mockUseTagsReturn,
      tags: [],
      tagStats: {
        ...mockTagStats,
        totalTags: 0,
        mostUsedTags: [],
        recentlyUsedTags: [],
      },
    });

    render(<TagManagement />);

    expect(screen.getByText('No tags created yet.')).toBeInTheDocument();
  });
});
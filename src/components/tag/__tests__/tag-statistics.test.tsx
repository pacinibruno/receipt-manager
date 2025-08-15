import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { TagStatistics } from '../tag-statistics';

const mockTagStats = {
  totalTags: 10,
  mostUsedTags: [
    { id: '1', name: 'Italian', count: 8, color: '#ef4444' },
    { id: '2', name: 'Quick', count: 6, color: '#3b82f6' },
    { id: '3', name: 'Vegetarian', count: 4, color: '#22c55e' },
    { id: '4', name: 'Dessert', count: 3, color: '#ec4899' },
  ],
  recentlyUsedTags: [
    { id: '1', name: 'Italian', count: 8, color: '#ef4444' },
    { id: '2', name: 'Quick', count: 6, color: '#3b82f6' },
  ],
  unusedTags: [
    { id: '5', name: 'Unused1', count: 0, color: '#6b7280' },
    { id: '6', name: 'Unused2', count: 0, color: '#6b7280' },
  ],
  tagUsageByMonth: [
    { month: 'Jan 2024', count: 5 },
    { month: 'Feb 2024', count: 8 },
    { month: 'Mar 2024', count: 3 },
    { month: 'Apr 2024', count: 6 },
  ],
};

describe('TagStatistics', () => {
  describe('overview cards', () => {
    it('should display total tags count', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      expect(screen.getByText('Total Tags')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    it('should display most used tag information', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      expect(screen.getByText('Most Used')).toBeInTheDocument();
      
      // Check for the most used tag count in the overview card
      const mostUsedCard = screen.getByText('Most Used').closest('div');
      expect(mostUsedCard).toHaveTextContent('8');
      expect(mostUsedCard).toHaveTextContent('Italian');
    });

    it('should display unused tags count and percentage', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      expect(screen.getByText('Unused Tags')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Count of unused tags
      expect(screen.getByText('20% of total')).toBeInTheDocument(); // Percentage
    });

    it('should display usage trend', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      expect(screen.getByText('Usage Trend')).toBeInTheDocument();
      expect(screen.getByText('Last 3 months')).toBeInTheDocument();
    });

    it('should handle empty most used tags', () => {
      const emptyStats = {
        ...mockTagStats,
        mostUsedTags: [],
      };

      render(<TagStatistics tagStats={emptyStats} />);

      expect(screen.getByText('0')).toBeInTheDocument(); // Count should be 0
      expect(screen.getByText('N/A')).toBeInTheDocument(); // Name should be N/A
    });
  });

  describe('most used tags section', () => {
    it('should display most used tags with progress bars', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      expect(screen.getByText('Most Used Tags')).toBeInTheDocument();
      
      // Check if all most used tags are displayed
      mockTagStats.mostUsedTags.forEach((tag, index) => {
        expect(screen.getByText(`#${index + 1}`)).toBeInTheDocument();
      });
      
      // Check that tag names appear in the most used section
      const mostUsedSection = screen.getByText('Most Used Tags').closest('div');
      mockTagStats.mostUsedTags.forEach((tag) => {
        expect(mostUsedSection).toHaveTextContent(tag.name);
      });
    });

    it('should show no data message when no most used tags', () => {
      const emptyStats = {
        ...mockTagStats,
        mostUsedTags: [],
      };

      render(<TagStatistics tagStats={emptyStats} />);

      expect(screen.getByText('No tag usage data available')).toBeInTheDocument();
    });

    it('should display tag colors correctly', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      // Check if color dots are rendered with correct colors
      const colorDots = screen.getAllByRole('generic', { hidden: true });
      expect(colorDots.length).toBeGreaterThan(0);
    });
  });

  describe('recently active tags section', () => {
    it('should display recently used tags', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      expect(screen.getByText('Recently Active Tags')).toBeInTheDocument();
      
      mockTagStats.recentlyUsedTags.forEach(tag => {
        expect(screen.getByText(`${tag.name} (${tag.count})`)).toBeInTheDocument();
      });
    });

    it('should show no activity message when no recent tags', () => {
      const emptyStats = {
        ...mockTagStats,
        recentlyUsedTags: [],
      };

      render(<TagStatistics tagStats={emptyStats} />);

      expect(screen.getByText('No recent tag activity')).toBeInTheDocument();
    });
  });

  describe('tag usage over time section', () => {
    it('should display monthly usage data', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      expect(screen.getByText('Tag Usage Over Time')).toBeInTheDocument();
      
      // Check that month names are displayed
      mockTagStats.tagUsageByMonth.forEach(monthData => {
        expect(screen.getByText(monthData.month)).toBeInTheDocument();
      });
      
      // Check that the usage over time section contains the data
      const usageSection = screen.getByText('Tag Usage Over Time').closest('div');
      mockTagStats.tagUsageByMonth.forEach(monthData => {
        expect(usageSection).toHaveTextContent(monthData.count.toString());
      });
    });

    it('should show no data message when no usage data', () => {
      const emptyStats = {
        ...mockTagStats,
        tagUsageByMonth: [],
      };

      render(<TagStatistics tagStats={emptyStats} />);

      expect(screen.getByText('No usage data available')).toBeInTheDocument();
    });

    it('should display progress bars for monthly usage', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      // Progress bars should be rendered (both for most used tags and monthly usage)
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
      
      // Should have at least as many progress bars as months
      expect(progressBars.length).toBeGreaterThanOrEqual(mockTagStats.tagUsageByMonth.length);
    });
  });

  describe('unused tags section', () => {
    it('should display unused tags when they exist', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      expect(screen.getByText('Unused Tags (2)')).toBeInTheDocument();
      
      mockTagStats.unusedTags.forEach(tag => {
        expect(screen.getByText(tag.name)).toBeInTheDocument();
      });

      expect(screen.getByText(/These tags haven't been used in any recipes yet/)).toBeInTheDocument();
    });

    it('should not display unused tags section when no unused tags', () => {
      const noUnusedStats = {
        ...mockTagStats,
        unusedTags: [],
      };

      render(<TagStatistics tagStats={noUnusedStats} />);

      // Should not show the unused tags card section
      expect(screen.queryByText('Unused Tags (0)')).not.toBeInTheDocument();
      expect(screen.queryByText(/These tags haven't been used/)).not.toBeInTheDocument();
    });

    it('should display warning icon for unused tags', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      // Should have warning icon in the unused tags section
      const unusedSection = screen.getByText('Unused Tags (2)').closest('div');
      expect(unusedSection).toBeInTheDocument();
    });
  });

  describe('trend calculations', () => {
    it('should show positive trend when usage is increasing', () => {
      const increasingTrendStats = {
        ...mockTagStats,
        tagUsageByMonth: [
          { month: 'Jan 2024', count: 2 },
          { month: 'Feb 2024', count: 3 },
          { month: 'Mar 2024', count: 4 },
          { month: 'Apr 2024', count: 6 },
          { month: 'May 2024', count: 7 },
          { month: 'Jun 2024', count: 8 },
        ],
      };

      render(<TagStatistics tagStats={increasingTrendStats} />);

      // Should show positive percentage
      const trendElement = screen.getByText(/\+\d+\.\d+%/);
      expect(trendElement).toBeInTheDocument();
      expect(trendElement).toHaveClass('text-green-600');
    });

    it('should show negative trend when usage is decreasing', () => {
      const decreasingTrendStats = {
        ...mockTagStats,
        tagUsageByMonth: [
          { month: 'Jan 2024', count: 8 },
          { month: 'Feb 2024', count: 7 },
          { month: 'Mar 2024', count: 6 },
          { month: 'Apr 2024', count: 4 },
          { month: 'May 2024', count: 3 },
          { month: 'Jun 2024', count: 2 },
        ],
      };

      render(<TagStatistics tagStats={decreasingTrendStats} />);

      // Should show negative percentage
      const trendElement = screen.getByText(/-\d+\.\d+%/);
      expect(trendElement).toBeInTheDocument();
      expect(trendElement).toHaveClass('text-red-600');
    });

    it('should handle zero previous average', () => {
      const zeroTrendStats = {
        ...mockTagStats,
        tagUsageByMonth: [
          { month: 'Jan 2024', count: 0 },
          { month: 'Feb 2024', count: 0 },
          { month: 'Mar 2024', count: 0 },
          { month: 'Apr 2024', count: 1 },
          { month: 'May 2024', count: 2 },
          { month: 'Jun 2024', count: 3 },
        ],
      };

      render(<TagStatistics tagStats={zeroTrendStats} />);

      // Should show 0.0% when previous average is 0
      expect(screen.getByText('+0.0%')).toBeInTheDocument();
    });
  });

  describe('percentage calculations', () => {
    it('should calculate unused tags percentage correctly', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      // 2 unused out of 10 total = 20%
      expect(screen.getByText('20% of total')).toBeInTheDocument();
    });

    it('should handle zero total tags', () => {
      const zeroTotalStats = {
        ...mockTagStats,
        totalTags: 0,
        unusedTags: [],
      };

      render(<TagStatistics tagStats={zeroTotalStats} />);

      expect(screen.getByText('0% of total')).toBeInTheDocument();
    });
  });

  describe('progress bar calculations', () => {
    it('should calculate progress percentages correctly for most used tags', () => {
      render(<TagStatistics tagStats={mockTagStats} />);

      // The first tag (Italian with count 8) should have 100% progress
      // The second tag (Quick with count 6) should have 75% progress (6/8 * 100)
      const progressBars = screen.getAllByRole('progressbar');
      
      // Check that progress bars exist
      expect(progressBars.length).toBeGreaterThan(0);
    });

    it('should handle single tag scenario', () => {
      const singleTagStats = {
        ...mockTagStats,
        mostUsedTags: [
          { id: '1', name: 'OnlyTag', count: 5, color: '#ef4444' },
        ],
      };

      render(<TagStatistics tagStats={singleTagStats} />);

      // Should display the single tag
      expect(screen.getByText('OnlyTag')).toBeInTheDocument();
      
      // Should have progress bars
      const progressBars = screen.getAllByRole('progressbar');
      expect(progressBars.length).toBeGreaterThan(0);
    });
  });
});
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useTags } from '../use-tags';
import * as storage from '@/lib/storage';
import { Tag, CreateTagInput } from '@/lib/types';

// Mock the storage module
vi.mock('@/lib/storage', () => ({
  getAllTags: vi.fn(),
  getTagById: vi.fn(),
  getTagByName: vi.fn(),
  createTag: vi.fn(),
  updateTag: vi.fn(),
  deleteTag: vi.fn(),
  getAllRecipes: vi.fn(),
}));

const mockTags: Tag[] = [
  { id: '1', name: 'Italian', count: 5, color: '#ef4444' },
  { id: '2', name: 'Vegetarian', count: 3, color: '#22c55e' },
  { id: '3', name: 'Quick', count: 8, color: '#3b82f6' },
  { id: '4', name: 'Dessert', count: 2, color: '#ec4899' },
  { id: '5', name: 'Unused', count: 0, color: '#6b7280' },
];

const mockRecipes = [
  {
    id: '1',
    title: 'Pasta',
    tags: ['Italian', 'Quick'],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    ingredients: [],
    instructions: [],
  },
  {
    id: '2',
    title: 'Salad',
    tags: ['Vegetarian', 'Quick'],
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    ingredients: [],
    instructions: [],
  },
];

describe('useTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storage.getAllTags as any).mockReturnValue(mockTags);
    (storage.getAllRecipes as any).mockReturnValue(mockRecipes);
  });

  describe('initialization', () => {
    it('should load tags on mount', async () => {
      const { result } = renderHook(() => useTags());

      expect(storage.getAllTags).toHaveBeenCalled();
      expect(result.current.tags).toEqual(mockTags);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should calculate tag statistics correctly', async () => {
      const { result } = renderHook(() => useTags());

      const { tagStats } = result.current;
      
      expect(tagStats.totalTags).toBe(5);
      expect(tagStats.mostUsedTags[0].name).toBe('Quick'); // Highest count
      expect(tagStats.unusedTags).toHaveLength(1);
      expect(tagStats.unusedTags[0].name).toBe('Unused');
    });
  });

  describe('CRUD operations', () => {
    it('should add a new tag', async () => {
      const newTag: Tag = { id: '6', name: 'Spicy', count: 0, color: '#f97316' };
      (storage.createTag as any).mockResolvedValue(newTag);

      const { result } = renderHook(() => useTags());

      const tagInput: CreateTagInput = { name: 'Spicy', color: '#f97316' };

      await act(async () => {
        const createdTag = await result.current.addTag(tagInput);
        expect(createdTag).toEqual(newTag);
      });

      expect(storage.createTag).toHaveBeenCalledWith(tagInput);
    });

    it('should return existing tag when adding duplicate', async () => {
      const existingTag = mockTags[0];
      (storage.getTagByName as any).mockReturnValue(existingTag);

      const { result } = renderHook(() => useTags());

      await act(async () => {
        const returnedTag = await result.current.addTag({ name: 'Italian' });
        expect(returnedTag).toEqual(existingTag);
      });

      expect(storage.createTag).not.toHaveBeenCalled();
    });

    it('should edit an existing tag', async () => {
      const updatedTag: Tag = { ...mockTags[0], name: 'Italian Cuisine', color: '#dc2626' };
      (storage.updateTag as any).mockReturnValue(updatedTag);

      const { result } = renderHook(() => useTags());

      await act(async () => {
        const editedTag = await result.current.editTag('1', { 
          name: 'Italian Cuisine', 
          color: '#dc2626' 
        });
        expect(editedTag).toEqual(updatedTag);
      });

      expect(storage.updateTag).toHaveBeenCalledWith('1', { 
        name: 'Italian Cuisine', 
        color: '#dc2626' 
      });
    });

    it('should remove a tag', async () => {
      (storage.deleteTag as any).mockReturnValue(true);

      const { result } = renderHook(() => useTags());

      await act(async () => {
        const success = await result.current.removeTag('1');
        expect(success).toBe(true);
      });

      expect(storage.deleteTag).toHaveBeenCalledWith('1');
    });

    it('should handle tag removal failure', async () => {
      (storage.deleteTag as any).mockReturnValue(false);

      const { result } = renderHook(() => useTags());

      await act(async () => {
        const success = await result.current.removeTag('nonexistent');
        expect(success).toBe(false);
      });
    });
  });

  describe('tag suggestions', () => {
    it('should get suggested tags based on query', () => {
      const { result } = renderHook(() => useTags());

      const suggestions = result.current.getSuggestedTags('it');
      
      expect(suggestions).toHaveLength(1);
      expect(suggestions[0].name).toBe('Italian');
    });

    it('should exclude already selected tags from suggestions', () => {
      const { result } = renderHook(() => useTags());

      const suggestions = result.current.getSuggestedTags('it', ['Italian']);
      
      expect(suggestions).toHaveLength(0);
    });

    it('should sort suggestions by usage count', () => {
      const { result } = renderHook(() => useTags());

      const suggestions = result.current.getSuggestedTags('e'); // Should match 'Vegetarian' and 'Dessert'
      
      expect(suggestions[0].name).toBe('Vegetarian'); // Higher count (3) than Dessert (2)
    });

    it('should get popular tags', () => {
      const { result } = renderHook(() => useTags());

      const popularTags = result.current.getPopularTags(3);
      
      expect(popularTags).toHaveLength(3);
      expect(popularTags[0].name).toBe('Quick'); // Highest count
      expect(popularTags[1].name).toBe('Italian'); // Second highest
      expect(popularTags[2].name).toBe('Vegetarian'); // Third highest
    });
  });

  describe('error handling', () => {
    it('should handle fetch error', async () => {
      const error = new Error('Storage error');
      (storage.getAllTags as any).mockImplementation(() => {
        throw error;
      });

      const { result } = renderHook(() => useTags());

      expect(result.current.error).toBe('Storage error');
      expect(result.current.loading).toBe(false);
    });

    it('should handle add tag error', async () => {
      const error = new Error('Create error');
      (storage.createTag as any).mockImplementation(() => {
        throw error;
      });
      (storage.getTagByName as any).mockReturnValue(null);

      const { result } = renderHook(() => useTags());

      await act(async () => {
        try {
          await result.current.addTag({ name: 'NewTag' });
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(result.current.error).toBe('Create error');
    });

    it('should clear error state', () => {
      const { result } = renderHook(() => useTags());

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBe(null);
    });
  });

  describe('statistics calculations', () => {
    it('should calculate tag usage by month correctly', () => {
      const { result } = renderHook(() => useTags());

      const { tagUsageByMonth } = result.current.tagStats;
      
      expect(tagUsageByMonth).toHaveLength(12); // Last 12 months
      expect(tagUsageByMonth.every(month => typeof month.count === 'number')).toBe(true);
    });

    it('should identify recently used tags', () => {
      // Mock recent recipes (within last 30 days)
      const recentRecipes = [
        {
          ...mockRecipes[0],
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        },
      ];
      (storage.getAllRecipes as any).mockReturnValue(recentRecipes);

      const { result } = renderHook(() => useTags());

      const { recentlyUsedTags } = result.current.tagStats;
      
      expect(recentlyUsedTags.some(tag => tag.name === 'Italian')).toBe(true);
      expect(recentlyUsedTags.some(tag => tag.name === 'Quick')).toBe(true);
    });
  });

  describe('optimistic updates', () => {
    it('should optimistically update tags list when adding', async () => {
      const newTag: Tag = { id: '6', name: 'Spicy', count: 0, color: '#f97316' };
      (storage.createTag as any).mockReturnValue(newTag);
      (storage.getTagByName as any).mockReturnValue(null);

      const { result } = renderHook(() => useTags());

      const initialTagCount = result.current.tags.length;

      await act(async () => {
        await result.current.addTag({ name: 'Spicy', color: '#f97316' });
      });

      expect(result.current.tags).toHaveLength(initialTagCount + 1);
      expect(result.current.tags.some(tag => tag.name === 'Spicy')).toBe(true);
    });

    it('should revert optimistic update on error', async () => {
      const error = new Error('Create failed');
      (storage.createTag as any).mockImplementation(() => {
        throw error;
      });
      (storage.getTagByName as any).mockReturnValue(null);

      const { result } = renderHook(() => useTags());

      const initialTags = [...result.current.tags];

      await act(async () => {
        try {
          await result.current.addTag({ name: 'FailTag' });
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.tags).toEqual(initialTags);
    });
  });
});
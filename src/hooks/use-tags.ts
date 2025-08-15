'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  CreateTagInput,
} from '@/lib/types';
import {
  getAllTags,
  getTagById,
  getTagByName,
  createTag,
  updateTag,
  deleteTag,
  getAllRecipes,
} from '@/lib/storage';

interface UseTagsState {
  tags: Tag[];
  loading: boolean;
  error: string | null;
  tagStats: TagStatistics;
}

interface TagStatistics {
  totalTags: number;
  mostUsedTags: Tag[];
  recentlyUsedTags: Tag[];
  unusedTags: Tag[];
  tagUsageByMonth: { month: string; count: number }[];
}

interface UseTagsActions {
  // CRUD operations
  addTag: (input: CreateTagInput) => Promise<Tag>;
  editTag: (id: string, input: Partial<CreateTagInput>) => Promise<Tag>;
  removeTag: (id: string) => Promise<boolean>;
  
  // Data fetching
  fetchTags: () => Promise<void>;
  fetchTag: (id: string) => Promise<Tag | null>;
  
  // Tag suggestions
  getSuggestedTags: (query: string, excludeTags?: string[]) => Tag[];
  getPopularTags: (limit?: number) => Tag[];
  
  // Statistics
  refreshTagStats: () => Promise<void>;
  
  // State management
  clearError: () => void;
}

export interface UseTagsReturn extends UseTagsState, UseTagsActions {}

export function useTags(): UseTagsReturn {
  const [state, setState] = useState<UseTagsState>({
    tags: [],
    loading: false,
    error: null,
    tagStats: {
      totalTags: 0,
      mostUsedTags: [],
      recentlyUsedTags: [],
      unusedTags: [],
      tagUsageByMonth: [],
    },
  });

  // Helper function to update state
  const updateState = useCallback((updates: Partial<UseTagsState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper function to handle errors
  const handleError = useCallback((error: unknown, operation: string) => {
    const errorMessage = error instanceof Error ? error.message : `Failed to ${operation}`;
    console.error(`Tag operation failed (${operation}):`, error);
    updateState({ error: errorMessage, loading: false });
  }, [updateState]);

  // Calculate tag statistics
  const calculateTagStats = useCallback((tags: Tag[]): TagStatistics => {
    const recipes = getAllRecipes();
    
    // Sort tags by usage count
    const sortedByUsage = [...tags].sort((a, b) => b.count - a.count);
    
    // Get most used tags (top 10)
    const mostUsedTags = sortedByUsage.slice(0, 10);
    
    // Get unused tags
    const unusedTags = tags.filter(tag => tag.count === 0);
    
    // Calculate recently used tags based on recipe creation dates
    const recentRecipes = recipes
      .filter(recipe => {
        const daysSinceCreated = (Date.now() - recipe.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceCreated <= 30; // Last 30 days
      });
    
    const recentTagCounts = new Map<string, number>();
    recentRecipes.forEach(recipe => {
      recipe.tags.forEach(tagName => {
        recentTagCounts.set(tagName, (recentTagCounts.get(tagName) || 0) + 1);
      });
    });
    
    const recentlyUsedTags = tags
      .filter(tag => recentTagCounts.has(tag.name))
      .sort((a, b) => (recentTagCounts.get(b.name) || 0) - (recentTagCounts.get(a.name) || 0))
      .slice(0, 10);
    
    // Calculate tag usage by month (last 12 months)
    const tagUsageByMonth: { month: string; count: number }[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const monthRecipes = recipes.filter(recipe => {
        const recipeMonth = recipe.createdAt.toISOString().slice(0, 7);
        return recipeMonth === monthKey;
      });
      
      const uniqueTagsInMonth = new Set<string>();
      monthRecipes.forEach(recipe => {
        recipe.tags.forEach(tag => uniqueTagsInMonth.add(tag));
      });
      
      tagUsageByMonth.push({
        month: monthName,
        count: uniqueTagsInMonth.size,
      });
    }
    
    return {
      totalTags: tags.length,
      mostUsedTags,
      recentlyUsedTags,
      unusedTags,
      tagUsageByMonth,
    };
  }, []);

  // Fetch all tags
  const fetchTags = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      const tags = getAllTags();
      const tagStats = calculateTagStats(tags);
      updateState({ tags, tagStats, loading: false });
    } catch (error) {
      handleError(error, 'fetch tags');
    }
  }, [updateState, handleError, calculateTagStats]);

  // Fetch single tag by ID
  const fetchTag = useCallback(async (id: string): Promise<Tag | null> => {
    try {
      updateState({ loading: true, error: null });
      const tag = getTagById(id);
      updateState({ loading: false });
      return tag;
    } catch (error) {
      handleError(error, 'fetch tag');
      return null;
    }
  }, [updateState, handleError]);

  // Add new tag
  const addTag = useCallback(async (input: CreateTagInput): Promise<Tag> => {
    try {
      updateState({ loading: true, error: null });
      
      // Check if tag already exists
      const existingTag = getTagByName(input.name);
      if (existingTag) {
        updateState({ loading: false });
        return existingTag;
      }
      
      const newTag = createTag(input);
      
      // Optimistically update the tags list
      setState(prev => {
        const updatedTags = [...prev.tags, newTag];
        const tagStats = calculateTagStats(updatedTags);
        return {
          ...prev,
          tags: updatedTags,
          tagStats,
          loading: false,
        };
      });
      
      return newTag;
    } catch (error) {
      // Revert optimistic update on error
      await fetchTags();
      handleError(error, 'add tag');
      throw error;
    }
  }, [updateState, handleError, fetchTags, calculateTagStats]);

  // Edit existing tag
  const editTag = useCallback(async (id: string, input: Partial<CreateTagInput>): Promise<Tag> => {
    try {
      updateState({ loading: true, error: null });
      
      const updatedTag = updateTag(id, input);
      
      // Optimistically update the tags list
      setState(prev => {
        const updatedTags = prev.tags.map(tag => 
          tag.id === id ? updatedTag : tag
        );
        const tagStats = calculateTagStats(updatedTags);
        return {
          ...prev,
          tags: updatedTags,
          tagStats,
          loading: false,
        };
      });
      
      return updatedTag;
    } catch (error) {
      // Revert optimistic update on error
      await fetchTags();
      handleError(error, 'update tag');
      throw error;
    }
  }, [updateState, handleError, fetchTags, calculateTagStats]);

  // Remove tag
  const removeTag = useCallback(async (id: string): Promise<boolean> => {
    try {
      updateState({ loading: true, error: null });
      
      // Store original tags for potential rollback
      const originalTags = state.tags;
      
      // Optimistically remove from the list
      setState(prev => {
        const updatedTags = prev.tags.filter(tag => tag.id !== id);
        const tagStats = calculateTagStats(updatedTags);
        return {
          ...prev,
          tags: updatedTags,
          tagStats,
          loading: false,
        };
      });
      
      const success = deleteTag(id);
      
      if (!success) {
        // Rollback on failure
        const tagStats = calculateTagStats(originalTags);
        updateState({ tags: originalTags, tagStats, error: 'Failed to delete tag' });
        return false;
      }
      
      return true;
    } catch (error) {
      // Revert optimistic update on error
      await fetchTags();
      handleError(error, 'delete tag');
      return false;
    }
  }, [state.tags, updateState, handleError, fetchTags, calculateTagStats]);

  // Get suggested tags based on query
  const getSuggestedTags = useCallback((query: string, excludeTags: string[] = []): Tag[] => {
    if (!query.trim()) return [];
    
    const queryLower = query.toLowerCase();
    const excludeSet = new Set(excludeTags.map(tag => tag.toLowerCase()));
    
    return state.tags
      .filter(tag => 
        tag.name.toLowerCase().includes(queryLower) &&
        !excludeSet.has(tag.name.toLowerCase())
      )
      .sort((a, b) => {
        // Prioritize exact matches, then by usage count
        const aExact = a.name.toLowerCase() === queryLower;
        const bExact = b.name.toLowerCase() === queryLower;
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        return b.count - a.count;
      })
      .slice(0, 10);
  }, [state.tags]);

  // Get popular tags
  const getPopularTags = useCallback((limit: number = 10): Tag[] => {
    return [...state.tags]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }, [state.tags]);

  // Refresh tag statistics
  const refreshTagStats = useCallback(async () => {
    try {
      const tags = getAllTags();
      const tagStats = calculateTagStats(tags);
      updateState({ tags, tagStats });
    } catch (error) {
      handleError(error, 'refresh tag statistics');
    }
  }, [updateState, handleError, calculateTagStats]);

  // Clear error state
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Load tags on mount
  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  return {
    // State
    tags: state.tags,
    loading: state.loading,
    error: state.error,
    tagStats: state.tagStats,
    
    // Actions
    addTag,
    editTag,
    removeTag,
    fetchTags,
    fetchTag,
    getSuggestedTags,
    getPopularTags,
    refreshTagStats,
    clearError,
  };
}
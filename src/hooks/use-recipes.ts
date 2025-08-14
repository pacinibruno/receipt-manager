'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Recipe,
  CreateRecipeInput,
  UpdateRecipeInput,
  SearchFilters,
  SearchResult,
} from '@/lib/types';
import {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  searchRecipes,
} from '@/lib/storage';

interface UseRecipesState {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  searchResults: SearchResult | null;
}

interface UseRecipesActions {
  // CRUD operations
  addRecipe: (input: CreateRecipeInput) => Promise<Recipe>;
  editRecipe: (id: string, input: Partial<CreateRecipeInput>) => Promise<Recipe>;
  removeRecipe: (id: string) => Promise<boolean>;
  duplicateRecipe: (id: string) => Promise<Recipe>;
  
  // Data fetching
  fetchRecipes: () => Promise<void>;
  fetchRecipe: (id: string) => Promise<Recipe | null>;
  searchRecipeList: (filters: SearchFilters) => Promise<SearchResult>;
  
  // State management
  clearError: () => void;
  clearSearchResults: () => void;
}

export interface UseRecipesReturn extends UseRecipesState, UseRecipesActions {}

export function useRecipes(): UseRecipesReturn {
  const [state, setState] = useState<UseRecipesState>({
    recipes: [],
    loading: false,
    error: null,
    searchResults: null,
  });

  // Helper function to update state
  const updateState = useCallback((updates: Partial<UseRecipesState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Helper function to handle errors
  const handleError = useCallback((error: unknown, operation: string) => {
    const errorMessage = error instanceof Error ? error.message : `Failed to ${operation}`;
    console.error(`Recipe operation failed (${operation}):`, error);
    updateState({ error: errorMessage, loading: false });
    throw error;
  }, [updateState]);

  // Fetch all recipes
  const fetchRecipes = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      const recipes = getAllRecipes();
      updateState({ recipes, loading: false });
    } catch (error) {
      handleError(error, 'fetch recipes');
    }
  }, [updateState, handleError]);

  // Fetch single recipe by ID
  const fetchRecipe = useCallback(async (id: string): Promise<Recipe | null> => {
    try {
      updateState({ loading: true, error: null });
      const recipe = getRecipeById(id);
      updateState({ loading: false });
      return recipe;
    } catch (error) {
      handleError(error, 'fetch recipe');
      return null;
    }
  }, [updateState, handleError]);

  // Add new recipe
  const addRecipe = useCallback(async (input: CreateRecipeInput): Promise<Recipe> => {
    try {
      updateState({ loading: true, error: null });
      
      const newRecipe = createRecipe(input);
      
      // Optimistically update the recipes list
      setState(prev => ({
        ...prev,
        recipes: [...prev.recipes, newRecipe],
        loading: false,
      }));
      
      return newRecipe;
    } catch (error) {
      // Revert optimistic update on error
      await fetchRecipes();
      handleError(error, 'add recipe');
      throw error;
    }
  }, [updateState, handleError, fetchRecipes]);

  // Edit existing recipe
  const editRecipe = useCallback(async (id: string, input: Partial<CreateRecipeInput>): Promise<Recipe> => {
    try {
      updateState({ loading: true, error: null });
      
      const updatedRecipe = updateRecipe(id, input);
      
      // Optimistically update the recipes list
      setState(prev => ({
        ...prev,
        recipes: prev.recipes.map(recipe => 
          recipe.id === id ? updatedRecipe : recipe
        ),
        loading: false,
      }));
      
      return updatedRecipe;
    } catch (error) {
      // Revert optimistic update on error
      await fetchRecipes();
      handleError(error, 'update recipe');
      throw error;
    }
  }, [updateState, handleError, fetchRecipes]);

  // Remove recipe
  const removeRecipe = useCallback(async (id: string): Promise<boolean> => {
    try {
      updateState({ loading: true, error: null });
      
      // Store original recipes for potential rollback
      const originalRecipes = state.recipes;
      
      // Optimistically remove from the list
      setState(prev => ({
        ...prev,
        recipes: prev.recipes.filter(recipe => recipe.id !== id),
        loading: false,
      }));
      
      const success = deleteRecipe(id);
      
      if (!success) {
        // Rollback on failure
        updateState({ recipes: originalRecipes, error: 'Failed to delete recipe' });
        return false;
      }
      
      return true;
    } catch (error) {
      // Revert optimistic update on error
      await fetchRecipes();
      handleError(error, 'delete recipe');
      return false;
    }
  }, [state.recipes, updateState, handleError, fetchRecipes]);

  // Duplicate recipe
  const duplicateRecipe = useCallback(async (id: string): Promise<Recipe> => {
    try {
      updateState({ loading: true, error: null });
      
      const originalRecipe = getRecipeById(id);
      if (!originalRecipe) {
        throw new Error('Recipe not found');
      }
      
      // Create a copy with modified title
      const duplicateInput: CreateRecipeInput = {
        title: `${originalRecipe.title} (Copy)`,
        description: originalRecipe.description,
        ingredients: originalRecipe.ingredients.map(ing => ({
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
        })),
        instructions: [...originalRecipe.instructions],
        tags: [...originalRecipe.tags],
        folderId: originalRecipe.folderId,
        prepTime: originalRecipe.prepTime,
        cookTime: originalRecipe.cookTime,
        servings: originalRecipe.servings,
        difficulty: originalRecipe.difficulty,
        imageUrl: originalRecipe.imageUrl,
        notes: originalRecipe.notes,
      };
      
      const duplicatedRecipe = createRecipe(duplicateInput);
      
      // Optimistically update the recipes list
      setState(prev => ({
        ...prev,
        recipes: [...prev.recipes, duplicatedRecipe],
        loading: false,
      }));
      
      return duplicatedRecipe;
    } catch (error) {
      // Revert optimistic update on error
      await fetchRecipes();
      handleError(error, 'duplicate recipe');
      throw error;
    }
  }, [updateState, handleError, fetchRecipes]);

  // Search recipes
  const searchRecipeList = useCallback(async (filters: SearchFilters): Promise<SearchResult> => {
    try {
      updateState({ loading: true, error: null });
      
      const searchResults = searchRecipes(filters);
      
      updateState({ 
        searchResults,
        loading: false,
      });
      
      return searchResults;
    } catch (error) {
      handleError(error, 'search recipes');
      throw error;
    }
  }, [updateState, handleError]);

  // Clear error state
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  // Clear search results
  const clearSearchResults = useCallback(() => {
    updateState({ searchResults: null });
  }, [updateState]);

  // Load recipes on mount
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  return {
    // State
    recipes: state.recipes,
    loading: state.loading,
    error: state.error,
    searchResults: state.searchResults,
    
    // Actions
    addRecipe,
    editRecipe,
    removeRecipe,
    duplicateRecipe,
    fetchRecipes,
    fetchRecipe,
    searchRecipeList,
    clearError,
    clearSearchResults,
  };
}
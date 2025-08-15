'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Plus, FolderOpen, Search as SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

import { FolderTreeWithDnd } from '@/components/folder/folder-tree-with-dnd';
import { SearchAndFilter } from '@/components/recipe/search-and-filter';
import { RecipeCard } from '@/components/recipe/recipe-card';
import { RecipeForm } from '@/components/recipe/recipe-form';

import { useRecipes } from '@/hooks/use-recipes';
import { useFolders } from '@/hooks/use-folders';
import { Recipe, CreateRecipeInput, SearchFilters } from '@/lib/types';
import { getAllTags } from '@/lib/storage';
import { cn } from '@/lib/utils';

export default function Home() {
  // State management
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  // Hooks
  const {
    recipes,
    loading: recipesLoading,
    error: recipesError,
    addRecipe,
    editRecipe,
    removeRecipe,
    searchRecipeList,
    searchResults,
    clearSearchResults,
  } = useRecipes();

  const {
    folders,
    loading: foldersLoading,
    error: foldersError,
  } = useFolders();

  // Load available tags
  useEffect(() => {
    try {
      const tags = getAllTags();
      setAvailableTags(tags.map(tag => tag.name));
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  }, [recipes]);

  // Filter recipes based on selected folder and search filters
  const filteredRecipes = useMemo(() => {
    let recipesToShow = recipes;

    // If we have search results, use those instead
    if (searchResults) {
      recipesToShow = searchResults.recipes;
    } else {
      // Filter by selected folder
      if (selectedFolderId !== undefined) {
        recipesToShow = recipes.filter(recipe => recipe.folderId === selectedFolderId);
      }
    }

    return recipesToShow;
  }, [recipes, selectedFolderId, searchResults]);

  // Handle search and filtering
  useEffect(() => {
    const hasActiveFilters = Object.keys(searchFilters).some(key => {
      const value = searchFilters[key as keyof SearchFilters];
      return value !== undefined && value !== '' && 
             (Array.isArray(value) ? value.length > 0 : true);
    });

    if (hasActiveFilters) {
      // Add folder filter if a folder is selected
      const filtersWithFolder = selectedFolderId !== undefined 
        ? { ...searchFilters, folderId: selectedFolderId }
        : searchFilters;
      
      searchRecipeList(filtersWithFolder);
    } else {
      clearSearchResults();
    }
  }, [searchFilters, selectedFolderId, searchRecipeList, clearSearchResults]);

  // Handle recipe form submission
  const handleAddRecipe = async (data: CreateRecipeInput) => {
    try {
      // If a folder is selected, add the recipe to that folder
      const recipeData = selectedFolderId 
        ? { ...data, folderId: selectedFolderId }
        : data;
      
      await addRecipe(recipeData);
      setShowAddRecipe(false);
    } catch (error) {
      console.error('Failed to add recipe:', error);
      throw error;
    }
  };

  const handleEditRecipe = async (data: CreateRecipeInput) => {
    if (!editingRecipe) return;
    
    try {
      await editRecipe(editingRecipe.id, data);
      setEditingRecipe(null);
    } catch (error) {
      console.error('Failed to edit recipe:', error);
      throw error;
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      try {
        await removeRecipe(recipeId);
      } catch (error) {
        console.error('Failed to delete recipe:', error);
      }
    }
  };

  // Get current folder name for display
  const currentFolderName = useMemo(() => {
    if (selectedFolderId === undefined) return 'All Recipes';
    const folder = folders.find(f => f.id === selectedFolderId);
    return folder?.name || 'Unknown Folder';
  }, [selectedFolderId, folders]);

  // Loading state
  const isLoading = recipesLoading || foldersLoading;

  // Error state
  const error = recipesError || foldersError;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Recipe Management</h1>
              <p className="text-muted-foreground">
                Organize, categorize, and manage your recipes with ease
              </p>
            </div>
            <Button onClick={() => setShowAddRecipe(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Recipe
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Folder Tree */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <FolderOpen className="h-4 w-4" />
                  <h2 className="font-semibold">Folders</h2>
                </div>
                
                {foldersError ? (
                  <div className="text-destructive text-sm">
                    Error loading folders: {foldersError}
                  </div>
                ) : (
                  <FolderTreeWithDnd
                    selectedFolderId={selectedFolderId}
                    onFolderSelect={setSelectedFolderId}
                    showManagement={true}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <SearchIcon className="h-4 w-4" />
                  <h2 className="font-semibold">Search & Filter</h2>
                </div>
                
                <SearchAndFilter
                  availableTags={availableTags}
                  filters={searchFilters}
                  onFiltersChange={setSearchFilters}
                  placeholder="Search recipes..."
                />
              </CardContent>
            </Card>

            {/* Recipe List Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{currentFolderName}</h2>
                <Badge variant="secondary">
                  {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>

            {/* Recipe List */}
            <div className="space-y-4">
              {error && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-destructive">
                      Error: {error}
                    </div>
                  </CardContent>
                </Card>
              )}

              {isLoading && (
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-muted-foreground">
                      Loading recipes...
                    </div>
                  </CardContent>
                </Card>
              )}

              {!isLoading && !error && filteredRecipes.length === 0 && (
                <Card>
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="text-muted-foreground">
                      {Object.keys(searchFilters).length > 0 || searchResults
                        ? 'No recipes match your search criteria.'
                        : selectedFolderId !== undefined
                        ? 'This folder is empty.'
                        : 'No recipes yet. Add your first recipe to get started!'}
                    </div>
                    {selectedFolderId === undefined && Object.keys(searchFilters).length === 0 && (
                      <Button onClick={() => setShowAddRecipe(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Your First Recipe
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {!isLoading && !error && filteredRecipes.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredRecipes.map((recipe) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onEdit={setEditingRecipe}
                      onDelete={handleDeleteRecipe}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Recipe Dialog */}
      <Dialog open={showAddRecipe} onOpenChange={setShowAddRecipe}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Recipe</DialogTitle>
          </DialogHeader>
          <RecipeForm
            onSubmit={handleAddRecipe}
            onCancel={() => setShowAddRecipe(false)}
            isLoading={recipesLoading}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Recipe Dialog */}
      <Dialog open={!!editingRecipe} onOpenChange={(open) => !open && setEditingRecipe(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recipe</DialogTitle>
          </DialogHeader>
          {editingRecipe && (
            <RecipeForm
              recipe={editingRecipe}
              onSubmit={handleEditRecipe}
              onCancel={() => setEditingRecipe(null)}
              isLoading={recipesLoading}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

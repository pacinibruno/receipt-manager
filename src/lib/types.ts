// Core data interfaces
export interface Recipe {
  id: string;
  title: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  tags: string[];
  folderId?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  imageUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  amount: string;
  unit?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  children: string[]; // folder IDs
  recipes: string[]; // recipe IDs
  createdAt: Date;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  count: number;
}

// Input types for creating/updating entities
export interface CreateRecipeInput {
  title: string;
  description?: string;
  ingredients: CreateIngredientInput[];
  instructions: string[];
  tags: string[];
  folderId?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  imageUrl?: string;
  notes?: string;
}

export interface UpdateRecipeInput extends Partial<CreateRecipeInput> {
  id: string;
}

export interface CreateIngredientInput {
  name: string;
  amount: string;
  unit?: string;
}

export interface CreateFolderInput {
  name: string;
  parentId?: string;
}

export interface UpdateFolderInput extends Partial<CreateFolderInput> {
  id: string;
}

export interface CreateTagInput {
  name: string;
  color?: string;
}

// Validation result types
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  tags?: string[];
  difficulty?: ('Easy' | 'Medium' | 'Hard')[];
  prepTimeMax?: number;
  cookTimeMax?: number;
  folderId?: string;
}

export interface SearchResult {
  recipes: Recipe[];
  totalCount: number;
  hasMore: boolean;
}

// Utility types
export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard';
export type SortOrder = 'asc' | 'desc';
export type SortField = 'title' | 'createdAt' | 'updatedAt' | 'prepTime' | 'cookTime';

// Error types
export class RecipeValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = 'RecipeValidationError';
  }
}

export class FolderValidationError extends Error {
  constructor(
    message: string,
    public field: string,
    public code: string
  ) {
    super(message);
    this.name = 'FolderValidationError';
  }
}

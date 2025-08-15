import {
  Recipe,
  Folder,
  Tag,
  CreateRecipeInput,
  UpdateRecipeInput,
  CreateFolderInput,
  UpdateFolderInput,
  CreateTagInput,
  SearchFilters,
  SearchResult,
} from './types';
import {
  generateRecipeId,
  generateFolderId,
  generateTagId,
  generateIngredientId,
  getCurrentTimestamp,
  isValidDate,
  parseDate,
} from './utils';

// Storage keys
const STORAGE_KEYS = {
  RECIPES: 'recipe_management_recipes',
  FOLDERS: 'recipe_management_folders',
  TAGS: 'recipe_management_tags',
  VERSION: 'recipe_management_version',
  METADATA: 'recipe_management_metadata',
} as const;

// Current data version for migration support
const CURRENT_VERSION = '1.0.0';

// Storage metadata interface
interface StorageMetadata {
  version: string;
  lastUpdated: Date;
  totalRecipes: number;
  totalFolders: number;
  totalTags: number;
}

// Error classes
export class StorageError extends Error {
  constructor(message: string, public operation: string, public cause?: Error) {
    super(message);
    this.name = 'StorageError';
  }
}

export class DataMigrationError extends Error {
  constructor(message: string, public fromVersion: string, public toVersion: string) {
    super(message);
    this.name = 'DataMigrationError';
  }
}

// Storage service class
export class RecipeStorageService {
  private static instance: RecipeStorageService;

  private constructor() {
    // Only initialize storage in browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      this.initializeStorage();
    }
  }

  public static getInstance(): RecipeStorageService {
    if (!RecipeStorageService.instance) {
      RecipeStorageService.instance = new RecipeStorageService();
    }
    return RecipeStorageService.instance;
  }

  private isInitialized = false;

  // Initialize storage and handle migrations
  private initializeStorage(): void {
    if (this.isInitialized) return;
    
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      const currentVersion = this.getStorageVersion();
      
      if (!currentVersion) {
        // First time setup
        this.createInitialStorage();
      } else if (currentVersion !== CURRENT_VERSION) {
        // Migration needed
        this.migrateData(currentVersion, CURRENT_VERSION);
      }
      
      this.updateMetadata();
      this.isInitialized = true;
    } catch (error) {
      console.error('Storage initialization error:', error);
      // Don't throw error, just log it and continue
      // This allows the app to work even if storage fails
      this.isInitialized = false;
    }
  }

  // Ensure storage is initialized before operations
  private ensureInitialized(): void {
    if (!this.isInitialized && typeof window !== 'undefined' && window.localStorage) {
      this.initializeStorage();
    }
  }

  private createInitialStorage(): void {
    this.setItem(STORAGE_KEYS.RECIPES, []);
    this.setItem(STORAGE_KEYS.FOLDERS, []);
    this.setItem(STORAGE_KEYS.TAGS, []);
    this.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);
  }

  private getStorageVersion(): string | null {
    return this.getItem<string>(STORAGE_KEYS.VERSION);
  }

  private migrateData(fromVersion: string, toVersion: string): void {
    try {
      // Migration logic would go here
      // For now, we'll just update the version
      console.log(`Migrating data from version ${fromVersion} to ${toVersion}`);
      
      // Future migration logic can be added here based on version comparisons
      if (fromVersion === '0.9.0' && toVersion === '1.0.0') {
        // Example migration logic
        this.migrateFromV0_9_0ToV1_0_0();
      }
      
      this.setItem(STORAGE_KEYS.VERSION, toVersion);
    } catch (error) {
      throw new DataMigrationError(
        `Failed to migrate data from ${fromVersion} to ${toVersion}`,
        fromVersion,
        toVersion
      );
    }
  }

  private migrateFromV0_9_0ToV1_0_0(): void {
    // Example migration: add missing fields to existing recipes
    const recipes = this.getItem<Recipe[]>(STORAGE_KEYS.RECIPES) || [];
    const updatedRecipes = recipes.map(recipe => ({
      ...recipe,
      difficulty: recipe.difficulty || 'Medium',
      createdAt: recipe.createdAt || getCurrentTimestamp(),
      updatedAt: recipe.updatedAt || getCurrentTimestamp(),
    }));
    this.setItem(STORAGE_KEYS.RECIPES, updatedRecipes);
  }

  private updateMetadata(): void {
    // Use direct getItem calls to avoid circular dependency during initialization
    const recipes = this.getItem<Recipe[]>(STORAGE_KEYS.RECIPES) || [];
    const folders = this.getItem<Folder[]>(STORAGE_KEYS.FOLDERS) || [];
    const tags = this.getItem<Tag[]>(STORAGE_KEYS.TAGS) || [];

    const metadata: StorageMetadata = {
      version: CURRENT_VERSION,
      lastUpdated: getCurrentTimestamp(),
      totalRecipes: recipes.length,
      totalFolders: folders.length,
      totalTags: tags.length,
    };

    this.setItem(STORAGE_KEYS.METADATA, metadata);
  }

  // Generic storage methods with error handling
  private getItem<T>(key: string): T | null {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return null;
      }
      
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      const parsed = JSON.parse(item);
      
      // Handle date deserialization
      if (Array.isArray(parsed)) {
        return parsed.map(this.deserializeDates) as T;
      } else if (typeof parsed === 'object' && parsed !== null) {
        return this.deserializeDates(parsed) as T;
      }
      
      return parsed;
    } catch (error) {
      throw new StorageError(
        `Failed to get item from storage: ${key}`,
        'get',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      const serialized = JSON.stringify(value, this.dateReplacer);
      localStorage.setItem(key, serialized);
    } catch (error) {
      throw new StorageError(
        `Failed to set item in storage: ${key}`,
        'set',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private removeItem(key: string): void {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return;
      }
      
      localStorage.removeItem(key);
    } catch (error) {
      throw new StorageError(
        `Failed to remove item from storage: ${key}`,
        'remove',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Date serialization helpers
  private dateReplacer = (key: string, value: any): any => {
    if (value instanceof Date) {
      return { __type: 'Date', value: value.toISOString() };
    }
    return value;
  }

  private deserializeDates = (obj: any): any => {
    if (obj && typeof obj === 'object') {
      if (obj.__type === 'Date') {
        return new Date(obj.value);
      }
      
      if (Array.isArray(obj)) {
        return obj.map(this.deserializeDates);
      }
      
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.deserializeDates(value);
      }
      return result;
    }
    return obj;
  }

  // Recipe CRUD operations
  public getAllRecipes(): Recipe[] {
    this.ensureInitialized();
    return this.getItem<Recipe[]>(STORAGE_KEYS.RECIPES) || [];
  }

  public getRecipeById(id: string): Recipe | null {
    this.ensureInitialized();
    const recipes = this.getAllRecipes();
    return recipes.find(recipe => recipe.id === id) || null;
  }

  public createRecipe(input: CreateRecipeInput): Recipe {
    this.ensureInitialized();
    try {
      const now = getCurrentTimestamp();
      const recipe: Recipe = {
        id: generateRecipeId(),
        ...input,
        ingredients: input.ingredients.map(ingredient => ({
          id: generateIngredientId(),
          ...ingredient,
        })),
        createdAt: now,
        updatedAt: now,
      };

      const recipes = this.getAllRecipes();
      recipes.push(recipe);
      this.setItem(STORAGE_KEYS.RECIPES, recipes);

      // Update folder if specified
      if (recipe.folderId) {
        this.addRecipeToFolder(recipe.folderId, recipe.id);
      }

      // Update tag counts
      this.updateTagCounts();
      this.updateMetadata();

      return recipe;
    } catch (error) {
      throw new StorageError(
        'Failed to create recipe',
        'createRecipe',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  public updateRecipe(input: UpdateRecipeInput): Recipe {
    this.ensureInitialized();
    try {
      const recipes = this.getAllRecipes();
      const index = recipes.findIndex(recipe => recipe.id === input.id);
      
      if (index === -1) {
        throw new Error(`Recipe with id ${input.id} not found`);
      }

      const existingRecipe = recipes[index];
      const updatedRecipe: Recipe = {
        ...existingRecipe,
        ...input,
        ingredients: input.ingredients 
          ? input.ingredients.map(ingredient => ({
              id: generateIngredientId(),
              ...ingredient,
            }))
          : existingRecipe.ingredients,
        updatedAt: getCurrentTimestamp(),
      };

      recipes[index] = updatedRecipe;
      this.setItem(STORAGE_KEYS.RECIPES, recipes);

      // Handle folder changes
      if (input.folderId !== undefined && input.folderId !== existingRecipe.folderId) {
        if (existingRecipe.folderId) {
          this.removeRecipeFromFolder(existingRecipe.folderId, input.id);
        }
        if (input.folderId) {
          this.addRecipeToFolder(input.folderId, input.id);
        }
      }

      this.updateTagCounts();
      this.updateMetadata();

      return updatedRecipe;
    } catch (error) {
      throw new StorageError(
        'Failed to update recipe',
        'updateRecipe',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  public deleteRecipe(id: string): boolean {
    this.ensureInitialized();
    try {
      const recipes = this.getAllRecipes();
      const index = recipes.findIndex(recipe => recipe.id === id);
      
      if (index === -1) {
        return false;
      }

      const recipe = recipes[index];
      
      // Remove from folder if assigned
      if (recipe.folderId) {
        this.removeRecipeFromFolder(recipe.folderId, id);
      }

      recipes.splice(index, 1);
      this.setItem(STORAGE_KEYS.RECIPES, recipes);

      this.updateTagCounts();
      this.updateMetadata();

      return true;
    } catch (error) {
      throw new StorageError(
        'Failed to delete recipe',
        'deleteRecipe',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  } 
 // Folder CRUD operations
  public getAllFolders(): Folder[] {
    this.ensureInitialized();
    return this.getItem<Folder[]>(STORAGE_KEYS.FOLDERS) || [];
  }

  public getFolderById(id: string): Folder | null {
    this.ensureInitialized();
    const folders = this.getAllFolders();
    return folders.find(folder => folder.id === id) || null;
  }

  public createFolder(input: CreateFolderInput): Folder {
    this.ensureInitialized();
    try {
      const folder: Folder = {
        id: generateFolderId(),
        ...input,
        children: [],
        recipes: [],
        createdAt: getCurrentTimestamp(),
      };

      const folders = this.getAllFolders();
      folders.push(folder);
      this.setItem(STORAGE_KEYS.FOLDERS, folders);

      // Add to parent folder if specified
      if (folder.parentId) {
        this.addChildToFolder(folder.parentId, folder.id);
      }

      this.updateMetadata();
      return folder;
    } catch (error) {
      throw new StorageError(
        'Failed to create folder',
        'createFolder',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  public updateFolder(input: UpdateFolderInput): Folder {
    this.ensureInitialized();
    try {
      const folders = this.getAllFolders();
      const index = folders.findIndex(folder => folder.id === input.id);
      
      if (index === -1) {
        throw new Error(`Folder with id ${input.id} not found`);
      }

      const existingFolder = folders[index];
      const updatedFolder: Folder = {
        ...existingFolder,
        ...input,
      };

      folders[index] = updatedFolder;
      this.setItem(STORAGE_KEYS.FOLDERS, folders);

      // Handle parent changes
      if (input.parentId !== undefined && input.parentId !== existingFolder.parentId) {
        if (existingFolder.parentId) {
          this.removeChildFromFolder(existingFolder.parentId, input.id);
        }
        if (input.parentId) {
          this.addChildToFolder(input.parentId, input.id);
        }
      }

      this.updateMetadata();
      return updatedFolder;
    } catch (error) {
      throw new StorageError(
        'Failed to update folder',
        'updateFolder',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  public deleteFolder(id: string): boolean {
    this.ensureInitialized();
    try {
      const folders = this.getAllFolders();
      const folder = folders.find(f => f.id === id);
      
      if (!folder) {
        return false;
      }

      // Move child folders to parent or root
      folder.children.forEach(childId => {
        this.updateFolder({
          id: childId,
          parentId: folder.parentId,
        });
      });

      // Move recipes to parent folder or unassign
      folder.recipes.forEach(recipeId => {
        this.updateRecipe({
          id: recipeId,
          folderId: folder.parentId,
        });
      });

      // Remove from parent folder
      if (folder.parentId) {
        this.removeChildFromFolder(folder.parentId, id);
      }

      // Remove the folder
      const index = folders.findIndex(f => f.id === id);
      folders.splice(index, 1);
      this.setItem(STORAGE_KEYS.FOLDERS, folders);

      this.updateMetadata();
      return true;
    } catch (error) {
      throw new StorageError(
        'Failed to delete folder',
        'deleteFolder',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private addRecipeToFolder(folderId: string, recipeId: string): void {
    const folders = this.getAllFolders();
    const folder = folders.find(f => f.id === folderId);
    
    if (folder && !folder.recipes.includes(recipeId)) {
      folder.recipes.push(recipeId);
      this.setItem(STORAGE_KEYS.FOLDERS, folders);
    }
  }

  private removeRecipeFromFolder(folderId: string, recipeId: string): void {
    const folders = this.getAllFolders();
    const folder = folders.find(f => f.id === folderId);
    
    if (folder) {
      folder.recipes = folder.recipes.filter(id => id !== recipeId);
      this.setItem(STORAGE_KEYS.FOLDERS, folders);
    }
  }

  private addChildToFolder(parentId: string, childId: string): void {
    const folders = this.getAllFolders();
    const parent = folders.find(f => f.id === parentId);
    
    if (parent && !parent.children.includes(childId)) {
      parent.children.push(childId);
      this.setItem(STORAGE_KEYS.FOLDERS, folders);
    }
  }

  private removeChildFromFolder(parentId: string, childId: string): void {
    const folders = this.getAllFolders();
    const parent = folders.find(f => f.id === parentId);
    
    if (parent) {
      parent.children = parent.children.filter(id => id !== childId);
      this.setItem(STORAGE_KEYS.FOLDERS, folders);
    }
  }

  // Tag CRUD operations
  public getAllTags(): Tag[] {
    this.ensureInitialized();
    return this.getItem<Tag[]>(STORAGE_KEYS.TAGS) || [];
  }

  public getTagById(id: string): Tag | null {
    this.ensureInitialized();
    const tags = this.getAllTags();
    return tags.find(tag => tag.id === id) || null;
  }

  public getTagByName(name: string): Tag | null {
    this.ensureInitialized();
    const tags = this.getAllTags();
    return tags.find(tag => tag.name.toLowerCase() === name.toLowerCase()) || null;
  }

  public createTag(input: CreateTagInput): Tag {
    this.ensureInitialized();
    try {
      // Check if tag already exists
      const existingTag = this.getTagByName(input.name);
      if (existingTag) {
        return existingTag;
      }

      const tag: Tag = {
        id: generateTagId(),
        ...input,
        count: 0,
      };

      const tags = this.getAllTags();
      tags.push(tag);
      this.setItem(STORAGE_KEYS.TAGS, tags);

      this.updateMetadata();
      return tag;
    } catch (error) {
      throw new StorageError(
        'Failed to create tag',
        'createTag',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  public updateTag(id: string, input: Partial<CreateTagInput>): Tag {
    this.ensureInitialized();
    try {
      const tags = this.getAllTags();
      const index = tags.findIndex(tag => tag.id === id);
      
      if (index === -1) {
        throw new Error(`Tag with id ${id} not found`);
      }

      const updatedTag: Tag = {
        ...tags[index],
        ...input,
      };

      tags[index] = updatedTag;
      this.setItem(STORAGE_KEYS.TAGS, tags);

      this.updateMetadata();
      return updatedTag;
    } catch (error) {
      throw new StorageError(
        'Failed to update tag',
        'updateTag',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  public deleteTag(id: string): boolean {
    this.ensureInitialized();
    try {
      const tags = this.getAllTags();
      const tag = tags.find(t => t.id === id);
      
      if (!tag) {
        return false;
      }

      // Remove tag from all recipes
      const recipes = this.getAllRecipes();
      const updatedRecipes = recipes.map(recipe => ({
        ...recipe,
        tags: recipe.tags.filter(tagName => tagName !== tag.name),
        updatedAt: getCurrentTimestamp(),
      }));
      this.setItem(STORAGE_KEYS.RECIPES, updatedRecipes);

      // Remove the tag
      const index = tags.findIndex(t => t.id === id);
      tags.splice(index, 1);
      this.setItem(STORAGE_KEYS.TAGS, tags);

      this.updateMetadata();
      return true;
    } catch (error) {
      throw new StorageError(
        'Failed to delete tag',
        'deleteTag',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private updateTagCounts(): void {
    try {
      const recipes = this.getItem<Recipe[]>(STORAGE_KEYS.RECIPES) || [];
      const tags = this.getItem<Tag[]>(STORAGE_KEYS.TAGS) || [];
      
      // Count tag usage
      const tagCounts = new Map<string, number>();
      recipes.forEach(recipe => {
        recipe.tags.forEach(tagName => {
          tagCounts.set(tagName, (tagCounts.get(tagName) || 0) + 1);
        });
      });

      // Update tag counts and create missing tags
      const updatedTags = [...tags];
      const existingTagNames = new Set(tags.map(tag => tag.name.toLowerCase()));

      // Update existing tags
      updatedTags.forEach(tag => {
        tag.count = tagCounts.get(tag.name) || 0;
      });

      // Create tags that exist in recipes but not in tag list
      tagCounts.forEach((count, tagName) => {
        if (!existingTagNames.has(tagName.toLowerCase())) {
          updatedTags.push({
            id: generateTagId(),
            name: tagName,
            count,
          });
        }
      });

      this.setItem(STORAGE_KEYS.TAGS, updatedTags);
    } catch (error) {
      throw new StorageError(
        'Failed to update tag counts',
        'updateTagCounts',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Search and filter operations
  public searchRecipes(filters: SearchFilters): SearchResult {
    this.ensureInitialized();
    try {
      let recipes = this.getAllRecipes();

      // Apply folder filter
      if (filters.folderId) {
        recipes = recipes.filter(recipe => recipe.folderId === filters.folderId);
      }

      // Apply text search
      if (filters.query) {
        const query = filters.query.toLowerCase();
        recipes = recipes.filter(recipe => {
          const searchableText = [
            recipe.title,
            recipe.description || '',
            ...recipe.instructions,
            ...recipe.ingredients.map(ing => `${ing.name} ${ing.amount} ${ing.unit || ''}`),
            ...recipe.tags,
            recipe.notes || '',
          ].join(' ').toLowerCase();
          
          return searchableText.includes(query);
        });
      }

      // Apply tag filters
      if (filters.tags && filters.tags.length > 0) {
        recipes = recipes.filter(recipe =>
          filters.tags!.some(tag => recipe.tags.includes(tag))
        );
      }

      // Apply difficulty filter
      if (filters.difficulty && filters.difficulty.length > 0) {
        recipes = recipes.filter(recipe =>
          recipe.difficulty && filters.difficulty!.includes(recipe.difficulty)
        );
      }

      // Apply time filters
      if (filters.prepTimeMax !== undefined) {
        recipes = recipes.filter(recipe =>
          !recipe.prepTime || recipe.prepTime <= filters.prepTimeMax!
        );
      }

      if (filters.cookTimeMax !== undefined) {
        recipes = recipes.filter(recipe =>
          !recipe.cookTime || recipe.cookTime <= filters.cookTimeMax!
        );
      }

      return {
        recipes,
        totalCount: recipes.length,
        hasMore: false, // For future pagination support
      };
    } catch (error) {
      throw new StorageError(
        'Failed to search recipes',
        'searchRecipes',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  // Utility methods
  public getStorageMetadata(): StorageMetadata | null {
    this.ensureInitialized();
    return this.getItem<StorageMetadata>(STORAGE_KEYS.METADATA);
  }

  public exportData(): {
    recipes: Recipe[];
    folders: Folder[];
    tags: Tag[];
    metadata: StorageMetadata | null;
  } {
    this.ensureInitialized();
    try {
      return {
        recipes: this.getAllRecipes(),
        folders: this.getAllFolders(),
        tags: this.getAllTags(),
        metadata: this.getStorageMetadata(),
      };
    } catch (error) {
      throw new StorageError(
        'Failed to export data',
        'exportData',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  public importData(data: {
    recipes: Recipe[];
    folders: Folder[];
    tags: Tag[];
  }): void {
    this.ensureInitialized();
    try {
      // Validate data structure
      if (!Array.isArray(data.recipes) || !Array.isArray(data.folders) || !Array.isArray(data.tags)) {
        throw new Error('Invalid data structure');
      }

      // Clear existing data
      this.clearAllData();

      // Import new data
      this.setItem(STORAGE_KEYS.RECIPES, data.recipes);
      this.setItem(STORAGE_KEYS.FOLDERS, data.folders);
      this.setItem(STORAGE_KEYS.TAGS, data.tags);

      this.updateTagCounts();
      this.updateMetadata();
    } catch (error) {
      throw new StorageError(
        'Failed to import data',
        'importData',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  public clearAllData(): void {
    this.ensureInitialized();
    try {
      this.removeItem(STORAGE_KEYS.RECIPES);
      this.removeItem(STORAGE_KEYS.FOLDERS);
      this.removeItem(STORAGE_KEYS.TAGS);
      this.removeItem(STORAGE_KEYS.METADATA);
      
      this.createInitialStorage();
      this.updateMetadata();
    } catch (error) {
      throw new StorageError(
        'Failed to clear all data',
        'clearAllData',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  public getStorageSize(): number {
    this.ensureInitialized();
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.localStorage) {
        return 0;
      }
      
      let totalSize = 0;
      Object.values(STORAGE_KEYS).forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      });
      return totalSize;
    } catch (error) {
      throw new StorageError(
        'Failed to calculate storage size',
        'getStorageSize',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

// Export singleton instance
export const storageService = RecipeStorageService.getInstance();

// Export convenience functions with proper binding
export const getAllRecipes = () => storageService.getAllRecipes();
export const getRecipeById = (id: string) => storageService.getRecipeById(id);
export const createRecipe = (input: CreateRecipeInput) => storageService.createRecipe(input);
export const updateRecipe = (input: UpdateRecipeInput) => storageService.updateRecipe(input);
export const deleteRecipe = (id: string) => storageService.deleteRecipe(id);
export const getAllFolders = () => storageService.getAllFolders();
export const getFolderById = (id: string) => storageService.getFolderById(id);
export const createFolder = (input: CreateFolderInput) => storageService.createFolder(input);
export const updateFolder = (input: UpdateFolderInput) => storageService.updateFolder(input);
export const deleteFolder = (id: string) => storageService.deleteFolder(id);
export const getAllTags = () => storageService.getAllTags();
export const getTagById = (id: string) => storageService.getTagById(id);
export const getTagByName = (name: string) => storageService.getTagByName(name);
export const createTag = (input: CreateTagInput) => storageService.createTag(input);
export const updateTag = (id: string, input: Partial<CreateTagInput>) => storageService.updateTag(id, input);
export const deleteTag = (id: string) => storageService.deleteTag(id);
export const searchRecipes = (filters: SearchFilters) => storageService.searchRecipes(filters);
export const exportData = () => storageService.exportData();
export const importData = (data: { recipes: Recipe[]; folders: Folder[]; tags: Tag[] }) => storageService.importData(data);
export const clearAllData = () => storageService.clearAllData();
export const getStorageMetadata = () => storageService.getStorageMetadata();
export const getStorageSize = () => storageService.getStorageSize();
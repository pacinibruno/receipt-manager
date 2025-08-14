import {
  Recipe,
  Ingredient,
  Folder,
  Tag,
  CreateRecipeInput,
  CreateIngredientInput,
  CreateFolderInput,
  CreateTagInput,
} from './types';
import {
  generateRecipeId,
  generateIngredientId,
  generateFolderId,
  generateTagId,
  getCurrentTimestamp,
} from './utils';
import { sanitizeRecipeInput } from './validation';

// Recipe transformers
export function createRecipeFromInput(input: CreateRecipeInput): Recipe {
  const sanitizedInput = sanitizeRecipeInput(input);
  const now = getCurrentTimestamp();

  return {
    id: generateRecipeId(),
    title: sanitizedInput.title,
    description: sanitizedInput.description,
    ingredients: sanitizedInput.ingredients.map(createIngredientFromInput),
    instructions: sanitizedInput.instructions,
    tags: sanitizedInput.tags,
    folderId: sanitizedInput.folderId,
    prepTime: sanitizedInput.prepTime,
    cookTime: sanitizedInput.cookTime,
    servings: sanitizedInput.servings,
    difficulty: sanitizedInput.difficulty,
    imageUrl: sanitizedInput.imageUrl,
    notes: sanitizedInput.notes,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateRecipeFromInput(existingRecipe: Recipe, input: Partial<CreateRecipeInput>): Recipe {
  // Only sanitize if we have the required fields for sanitization
  const shouldSanitize = input.title && input.instructions && input.tags && input.ingredients;
  const sanitizedInput = shouldSanitize ? sanitizeRecipeInput(input as CreateRecipeInput) : input;
  
  return {
    ...existingRecipe,
    ...sanitizedInput,
    ingredients: sanitizedInput.ingredients 
      ? sanitizedInput.ingredients.map(createIngredientFromInput)
      : existingRecipe.ingredients,
    updatedAt: getCurrentTimestamp(),
  };
}

// Ingredient transformers
export function createIngredientFromInput(input: CreateIngredientInput): Ingredient {
  return {
    id: generateIngredientId(),
    name: input.name.trim(),
    amount: input.amount.trim(),
    unit: input.unit?.trim(),
  };
}

// Folder transformers
export function createFolderFromInput(input: CreateFolderInput): Folder {
  return {
    id: generateFolderId(),
    name: input.name.trim(),
    parentId: input.parentId,
    children: [],
    recipes: [],
    createdAt: getCurrentTimestamp(),
  };
}

export function updateFolderFromInput(existingFolder: Folder, input: Partial<CreateFolderInput>): Folder {
  return {
    ...existingFolder,
    name: input.name ? input.name.trim() : existingFolder.name,
    parentId: input.parentId !== undefined ? input.parentId : existingFolder.parentId,
  };
}

// Tag transformers
export function createTagFromInput(input: CreateTagInput): Tag {
  return {
    id: generateTagId(),
    name: input.name.trim(),
    color: input.color,
    count: 0,
  };
}

// Data serialization for storage
export function serializeRecipe(recipe: Recipe): string {
  return JSON.stringify({
    ...recipe,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
  });
}

export function deserializeRecipe(data: string): Recipe {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
    updatedAt: new Date(parsed.updatedAt),
  };
}

export function serializeFolder(folder: Folder): string {
  return JSON.stringify({
    ...folder,
    createdAt: folder.createdAt.toISOString(),
  });
}

export function deserializeFolder(data: string): Folder {
  const parsed = JSON.parse(data);
  return {
    ...parsed,
    createdAt: new Date(parsed.createdAt),
  };
}

export function serializeTag(tag: Tag): string {
  return JSON.stringify(tag);
}

export function deserializeTag(data: string): Tag {
  return JSON.parse(data);
}

// Bulk operations
export function serializeRecipes(recipes: Recipe[]): string {
  return JSON.stringify(recipes.map(recipe => ({
    ...recipe,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
  })));
}

export function deserializeRecipes(data: string): Recipe[] {
  const parsed = JSON.parse(data);
  return parsed.map((recipe: any) => ({
    ...recipe,
    createdAt: new Date(recipe.createdAt),
    updatedAt: new Date(recipe.updatedAt),
  }));
}

export function serializeFolders(folders: Folder[]): string {
  return JSON.stringify(folders.map(folder => ({
    ...folder,
    createdAt: folder.createdAt.toISOString(),
  })));
}

export function deserializeFolders(data: string): Folder[] {
  const parsed = JSON.parse(data);
  return parsed.map((folder: any) => ({
    ...folder,
    createdAt: new Date(folder.createdAt),
  }));
}

// Recipe utility transformers
export function getRecipeTotalTime(recipe: Recipe): number | undefined {
  if (recipe.prepTime !== undefined && recipe.cookTime !== undefined) {
    return recipe.prepTime + recipe.cookTime;
  }
  return recipe.prepTime || recipe.cookTime;
}

export function getRecipeTagsAsString(recipe: Recipe): string {
  return recipe.tags.join(', ');
}

export function getRecipeIngredientsText(recipe: Recipe): string {
  return recipe.ingredients
    .map(ingredient => `${ingredient.amount}${ingredient.unit ? ` ${ingredient.unit}` : ''} ${ingredient.name}`)
    .join(', ');
}

export function getRecipeSearchableText(recipe: Recipe): string {
  return [
    recipe.title,
    recipe.description || '',
    recipe.tags.join(' '),
    getRecipeIngredientsText(recipe),
    recipe.instructions.join(' '),
    recipe.notes || '',
  ].join(' ').toLowerCase();
}

// Folder utility transformers
export function getFolderPath(folder: Folder, allFolders: Folder[]): string[] {
  const path: string[] = [folder.name];
  let currentFolder = folder;

  while (currentFolder.parentId) {
    const parentFolder = allFolders.find(f => f.id === currentFolder.parentId);
    if (!parentFolder) break;
    path.unshift(parentFolder.name);
    currentFolder = parentFolder;
  }

  return path;
}

export function getFolderDepth(folder: Folder, allFolders: Folder[]): number {
  let depth = 0;
  let currentFolder = folder;

  while (currentFolder.parentId) {
    const parentFolder = allFolders.find(f => f.id === currentFolder.parentId);
    if (!parentFolder) break;
    depth++;
    currentFolder = parentFolder;
  }

  return depth;
}

// Tag utility transformers
export function updateTagCounts(tags: Tag[], recipes: Recipe[]): Tag[] {
  const tagCounts = new Map<string, number>();

  // Count tag usage
  recipes.forEach(recipe => {
    recipe.tags.forEach(tagName => {
      tagCounts.set(tagName, (tagCounts.get(tagName) || 0) + 1);
    });
  });

  // Update tag counts
  return tags.map(tag => ({
    ...tag,
    count: tagCounts.get(tag.name) || 0,
  }));
}

export function getUnusedTags(tags: Tag[]): Tag[] {
  return tags.filter(tag => tag.count === 0);
}

export function getMostUsedTags(tags: Tag[], limit: number = 10): Tag[] {
  return [...tags]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
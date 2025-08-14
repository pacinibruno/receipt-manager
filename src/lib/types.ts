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

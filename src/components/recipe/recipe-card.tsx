'use client';

import React from 'react';
import { Recipe } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Clock, 
  Users, 
  ChefHat, 
  MoreVertical, 
  Edit, 
  Trash2,
  Eye
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (recipeId: string) => void;
  className?: string;
}

export function RecipeCard({ 
  recipe, 
  onEdit, 
  onDelete, 
  className 
}: RecipeCardProps) {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(`/recipe/${recipe.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(recipe);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(recipe.id);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/recipe/${recipe.id}`);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'Hard':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <Card 
      className={cn(
        "group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] border-border/50",
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight truncate group-hover:text-primary transition-colors">
              {recipe.title}
            </h3>
            {recipe.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {recipe.description}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Recipe actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Recipe metadata */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          {recipe.prepTime && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatTime(recipe.prepTime)}</span>
            </div>
          )}
          {recipe.servings && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{recipe.servings}</span>
            </div>
          )}
          {recipe.difficulty && (
            <div className="flex items-center gap-1">
              <ChefHat className="h-3 w-3" />
              <Badge 
                variant="secondary" 
                className={cn("text-xs", getDifficultyColor(recipe.difficulty))}
              >
                {recipe.difficulty}
              </Badge>
            </div>
          )}
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge 
                key={tag} 
                variant="outline" 
                className="text-xs px-2 py-0.5"
              >
                {tag}
              </Badge>
            ))}
            {recipe.tags.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-0.5 text-muted-foreground"
              >
                +{recipe.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Ingredients preview */}
        <div className="mt-3 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            {recipe.ingredients.length} ingredient{recipe.ingredients.length !== 1 ? 's' : ''}
            {recipe.ingredients.length > 0 && (
              <span className="ml-1">
                • {recipe.ingredients.slice(0, 2).map(ing => ing.name).join(', ')}
                {recipe.ingredients.length > 2 && '...'}
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
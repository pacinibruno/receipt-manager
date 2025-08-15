'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Clock, 
  Users, 
  ChefHat, 
  Printer,
  Share2,
  BookOpen,
  Tag
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { RecipeForm } from '@/components/recipe/recipe-form';
import { useRecipes } from '@/hooks/use-recipes';
import { Recipe, CreateRecipeInput } from '@/lib/types';
import { cn } from '@/lib/utils';

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default function RecipePage({ params }: RecipePageProps) {
  const router = useRouter();
  const [recipeId, setRecipeId] = useState<string>('');
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPrintMode, setIsPrintMode] = useState(false);

  const {
    fetchRecipe,
    editRecipe,
    removeRecipe,
    loading,
    error,
  } = useRecipes();

  // Extract params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setRecipeId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  // Fetch recipe data
  useEffect(() => {
    if (recipeId) {
      const loadRecipe = async () => {
        try {
          const fetchedRecipe = await fetchRecipe(recipeId);
          setRecipe(fetchedRecipe);
        } catch (error) {
          console.error('Failed to fetch recipe:', error);
        }
      };
      loadRecipe();
    }
  }, [recipeId, fetchRecipe]);

  const handleEdit = async (data: CreateRecipeInput) => {
    if (!recipe) return;
    
    try {
      await editRecipe(recipe.id, data);
      // Refresh recipe data
      const updatedRecipe = await fetchRecipe(recipe.id);
      setRecipe(updatedRecipe);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to edit recipe:', error);
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!recipe) return;
    
    if (confirm('Are you sure you want to delete this recipe?')) {
      try {
        await removeRecipe(recipe.id);
        router.push('/');
      } catch (error) {
        console.error('Failed to delete recipe:', error);
      }
    }
  };

  const handlePrint = () => {
    setIsPrintMode(true);
    setTimeout(() => {
      window.print();
      setIsPrintMode(false);
    }, 100);
  };

  const handleShare = async () => {
    if (navigator.share && recipe) {
      try {
        await navigator.share({
          title: recipe.title,
          text: recipe.description || `Check out this recipe: ${recipe.title}`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying URL to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Recipe URL copied to clipboard!');
      }
    } else {
      // Fallback for browsers without Web Share API
      navigator.clipboard.writeText(window.location.href);
      alert('Recipe URL copied to clipboard!');
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-muted-foreground">Loading recipe...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="text-destructive">
              {error || 'Recipe not found'}
            </div>
            <Button onClick={() => router.push('/')} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Recipes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-background", isPrintMode && "print:bg-white")}>
      {/* Header - Hidden in print mode */}
      <header className={cn("border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", isPrintMode && "print:hidden")}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Recipes
              </Button>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">{recipe.title}</h1>
                {recipe.description && (
                  <p className="text-muted-foreground">{recipe.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} className="gap-2">
                <Edit className="h-4 w-4" />
                Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Recipe Header for Print */}
          <div className={cn("hidden", isPrintMode && "print:block print:mb-6")}>
            <h1 className="text-3xl font-bold mb-2">{recipe.title}</h1>
            {recipe.description && (
              <p className="text-gray-600 mb-4">{recipe.description}</p>
            )}
          </div>

          {/* Recipe Metadata */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center gap-6 text-sm">
                {recipe.prepTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Prep:</span>
                    <span>{formatTime(recipe.prepTime)}</span>
                  </div>
                )}
                {recipe.cookTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Cook:</span>
                    <span>{formatTime(recipe.cookTime)}</span>
                  </div>
                )}
                {recipe.servings && (
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Serves:</span>
                    <span>{recipe.servings}</span>
                  </div>
                )}
                {recipe.difficulty && (
                  <div className="flex items-center gap-2">
                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                    <Badge className={cn("text-xs", getDifficultyColor(recipe.difficulty))}>
                      {recipe.difficulty}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Tags */}
              {recipe.tags.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">Tags:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recipe.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recipe Image */}
          {recipe.imageUrl && (
            <Card>
              <CardContent className="p-0">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.title}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ingredients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={ingredient.id || index} className="flex items-start gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <span>
                        <span className="font-medium">{ingredient.amount}</span>
                        {ingredient.unit && <span className="ml-1">{ingredient.unit}</span>}
                        <span className="ml-2">{ingredient.name}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5" />
                  Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <p className="text-sm leading-relaxed pt-0.5">{instruction}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {recipe.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{recipe.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Recipe Metadata for Print */}
          <div className={cn("hidden", isPrintMode && "print:block print:mt-8 print:pt-4 print:border-t")}>
            <p className="text-sm text-gray-500">
              Created: {new Date(recipe.createdAt).toLocaleDateString()}
              {recipe.updatedAt !== recipe.createdAt && (
                <span className="ml-4">
                  Updated: {new Date(recipe.updatedAt).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Edit Recipe Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Recipe</DialogTitle>
          </DialogHeader>
          <RecipeForm
            recipe={recipe}
            onSubmit={handleEdit}
            onCancel={() => setIsEditing(false)}
            isLoading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem !important;
          }
          .print\\:mt-8 {
            margin-top: 2rem !important;
          }
          .print\\:pt-4 {
            padding-top: 1rem !important;
          }
          .print\\:border-t {
            border-top: 1px solid #e5e7eb !important;
          }
        }
      `}</style>
    </div>
  );
}

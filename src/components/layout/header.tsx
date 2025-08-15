'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Plus, ChefHat, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onAddRecipe?: () => void;
  showAddButton?: boolean;
  className?: string;
}

export function Header({ onAddRecipe, showAddButton = true, className }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isHomePage = pathname === '/';
  const isRecipePage = pathname.startsWith('/recipe/');

  const handleAddRecipe = () => {
    if (onAddRecipe) {
      onAddRecipe();
    } else {
      // If no handler provided and not on home page, navigate to home
      if (!isHomePage) {
        router.push('/');
      }
    }
    setIsMobileMenuOpen(false);
  };

  const handleLogoClick = () => {
    router.push('/');
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={cn(
      "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50",
      className
    )}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Branding */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              aria-label="Go to home page"
            >
              <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-lg">
                <ChefHat className="h-5 w-5" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight">Recipe Manager</h1>
                <p className="text-xs text-muted-foreground hidden md:block">
                  Organize your culinary creations
                </p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            <Link
              href="/"
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isHomePage
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              All Recipes
            </Link>
            
            {showAddButton && (
              <Button onClick={handleAddRecipe} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Add Recipe
              </Button>
            )}
          </nav>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="flex items-center gap-2 pb-4 border-b">
                    <ChefHat className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Recipe Manager</span>
                  </div>
                  
                  <nav className="flex flex-col space-y-2">
                    <Link
                      href="/"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "px-3 py-2 text-sm font-medium rounded-md transition-colors text-left",
                        isHomePage
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      All Recipes
                    </Link>
                  </nav>

                  {showAddButton && (
                    <div className="pt-4 border-t">
                      <Button onClick={handleAddRecipe} className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Add Recipe
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
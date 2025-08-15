'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home, BookOpen } from 'lucide-react';
import { useFolders } from '@/hooks/use-folders';
import { useRecipes } from '@/hooks/use-recipes';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  isActive?: boolean;
}

interface BreadcrumbProps {
  className?: string;
  showIcons?: boolean;
}

export function Breadcrumb({ className, showIcons = true }: BreadcrumbProps) {
  const pathname = usePathname();
  const { folders } = useFolders();
  const { recipes } = useRecipes();

  const getBreadcrumbItems = (): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [];

    // Always start with home
    items.push({
      label: 'All Recipes',
      href: '/',
      icon: showIcons ? <Home className="h-4 w-4" /> : undefined,
      isActive: pathname === '/',
    });

    // Handle recipe pages
    if (pathname.startsWith('/recipe/')) {
      const recipeId = pathname.split('/')[2];
      const recipe = recipes.find(r => r.id === recipeId);
      
      if (recipe) {
        // Add folder breadcrumbs if recipe is in a folder
        if (recipe.folderId) {
          const folderPath = getFolderPath(recipe.folderId, folders);
          folderPath.forEach(folder => {
            items.push({
              label: folder.name,
              href: `/?folder=${folder.id}`,
              isActive: false,
            });
          });
        }

        // Add recipe item
        items.push({
          label: recipe.title,
          icon: showIcons ? <BookOpen className="h-4 w-4" /> : undefined,
          isActive: true,
        });
      }
    }

    return items;
  };

  const getFolderPath = (folderId: string, allFolders: any[]): any[] => {
    const path: any[] = [];
    let currentFolder = allFolders.find(f => f.id === folderId);
    
    while (currentFolder) {
      path.unshift(currentFolder);
      currentFolder = currentFolder.parentId 
        ? allFolders.find(f => f.id === currentFolder.parentId)
        : null;
    }
    
    return path;
  };

  const items = getBreadcrumbItems();

  // Don't render if only home item
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
          
          <div className="flex items-center gap-1.5 min-w-0">
            {item.icon && (
              <span className="flex-shrink-0">
                {item.icon}
              </span>
            )}
            
            {item.href && !item.isActive ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors truncate"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(
                "truncate",
                item.isActive && "text-foreground font-medium"
              )}>
                {item.label}
              </span>
            )}
          </div>
        </React.Fragment>
      ))}
    </nav>
  );
}

// Simplified breadcrumb for specific use cases
interface SimpleBreadcrumbProps {
  items: Array<{
    label: string;
    href?: string;
    isActive?: boolean;
  }>;
  className?: string;
}

export function SimpleBreadcrumb({ items, className }: SimpleBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground", className)}>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 flex-shrink-0" />
          )}
          
          {item.href && !item.isActive ? (
            <Link
              href={item.href}
              className="hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className={cn(
              item.isActive && "text-foreground font-medium"
            )}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
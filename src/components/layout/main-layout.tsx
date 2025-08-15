'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from './header';
import { Sidebar, useSidebar } from './sidebar';
import { Breadcrumb } from './breadcrumb';
import { SearchFilters } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: React.ReactNode;
  // Sidebar props
  selectedFolderId?: string;
  onFolderSelect?: (folderId: string | undefined) => void;
  searchFilters?: SearchFilters;
  onFiltersChange?: (filters: SearchFilters) => void;
  availableTags?: string[];
  foldersError?: string | null;
  // Header props
  onAddRecipe?: () => void;
  showAddButton?: boolean;
  // Layout props
  showSidebar?: boolean;
  showBreadcrumb?: boolean;
  className?: string;
}

export function MainLayout({
  children,
  selectedFolderId,
  onFolderSelect = () => {},
  searchFilters = {},
  onFiltersChange = () => {},
  availableTags = [],
  foldersError,
  onAddRecipe,
  showAddButton = true,
  showSidebar = true,
  showBreadcrumb = true,
  className,
}: MainLayoutProps) {
  const pathname = usePathname();
  const { isSidebarOpen, openSidebar, closeSidebar } = useSidebar();
  
  const isHomePage = pathname === '/';
  const isRecipePage = pathname.startsWith('/recipe/');

  return (
    <div className={cn("min-h-screen bg-background", className)}>
      {/* Header */}
      <Header
        onAddRecipe={onAddRecipe}
        showAddButton={showAddButton}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb Navigation */}
        {showBreadcrumb && !isHomePage && (
          <div className="mb-6">
            <Breadcrumb />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop Sidebar */}
          {showSidebar && isHomePage && (
            <div className="hidden lg:block lg:col-span-1">
              <Sidebar
                selectedFolderId={selectedFolderId}
                onFolderSelect={onFolderSelect}
                searchFilters={searchFilters}
                onFiltersChange={onFiltersChange}
                availableTags={availableTags}
                foldersError={foldersError}
              />
            </div>
          )}

          {/* Mobile Sidebar Toggle */}
          {showSidebar && isHomePage && (
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={openSidebar}
                className="gap-2"
              >
                <Menu className="h-4 w-4" />
                Filters & Folders
              </Button>
            </div>
          )}

          {/* Main Content */}
          <div className={cn(
            "w-full",
            showSidebar && isHomePage ? "lg:col-span-3" : "lg:col-span-4"
          )}>
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {showSidebar && isHomePage && (
        <Sidebar
          selectedFolderId={selectedFolderId}
          onFolderSelect={onFolderSelect}
          searchFilters={searchFilters}
          onFiltersChange={onFiltersChange}
          availableTags={availableTags}
          foldersError={foldersError}
          isMobile={true}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
        />
      )}
    </div>
  );
}

// Specialized layout for recipe pages
interface RecipeLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function RecipeLayout({ children, className }: RecipeLayoutProps) {
  return (
    <MainLayout
      showSidebar={false}
      showBreadcrumb={true}
      showAddButton={false}
      className={className}
    >
      {children}
    </MainLayout>
  );
}

// Specialized layout for home page
interface HomeLayoutProps {
  children: React.ReactNode;
  selectedFolderId?: string;
  onFolderSelect: (folderId: string | undefined) => void;
  searchFilters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTags: string[];
  foldersError?: string | null;
  onAddRecipe: () => void;
  className?: string;
}

export function HomeLayout({
  children,
  selectedFolderId,
  onFolderSelect,
  searchFilters,
  onFiltersChange,
  availableTags,
  foldersError,
  onAddRecipe,
  className,
}: HomeLayoutProps) {
  return (
    <MainLayout
      selectedFolderId={selectedFolderId}
      onFolderSelect={onFolderSelect}
      searchFilters={searchFilters}
      onFiltersChange={onFiltersChange}
      availableTags={availableTags}
      foldersError={foldersError}
      onAddRecipe={onAddRecipe}
      showSidebar={true}
      showBreadcrumb={false}
      showAddButton={true}
      className={className}
    >
      {children}
    </MainLayout>
  );
}
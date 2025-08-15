'use client';

import React from 'react';
import { FolderOpen, Search as SearchIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { FolderTreeWithDnd } from '@/components/folder/folder-tree-with-dnd';
import { SearchAndFilter } from '@/components/recipe/search-and-filter';
import { SearchFilters } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  selectedFolderId?: string;
  onFolderSelect: (folderId: string | undefined) => void;
  searchFilters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  availableTags: string[];
  foldersError?: string | null;
  className?: string;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  selectedFolderId,
  onFolderSelect,
  searchFilters,
  onFiltersChange,
  availableTags,
  foldersError,
  className,
  isMobile = false,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const sidebarContent = (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <SearchIcon className="h-4 w-4" />
            <h2 className="font-semibold">Search & Filter</h2>
          </div>
          
          <SearchAndFilter
            availableTags={availableTags}
            filters={searchFilters}
            onFiltersChange={onFiltersChange}
            placeholder="Search recipes..."
          />
        </CardContent>
      </Card>

      {/* Folder Tree Section */}
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
              onFolderSelect={onFolderSelect}
              showManagement={true}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="left" className="w-[300px] sm:w-[400px] overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Navigation
              </SheetTitle>
              {onClose && (
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside className={cn("w-full", className)}>
      {sidebarContent}
    </aside>
  );
}

// Hook for managing sidebar state
export function useSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const openSidebar = () => setIsSidebarOpen(true);
  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);

  return {
    isSidebarOpen,
    openSidebar,
    closeSidebar,
    toggleSidebar,
  };
}
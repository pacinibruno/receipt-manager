'use client';

import React, { useState } from 'react';
import { Folder } from '@/lib/types';
import { FolderItem } from './folder-item';
import { useFolders } from '@/hooks/use-folders';
import { cn } from '@/lib/utils';

interface FolderTreeProps {
  folders?: Folder[];
  selectedFolderId?: string;
  onFolderSelect?: (folderId: string | undefined) => void;
  className?: string;
  showManagement?: boolean;
}

export function FolderTree({
  folders: propFolders,
  selectedFolderId,
  onFolderSelect,
  className,
  showManagement = true,
}: FolderTreeProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  const {
    folders: hookFolders,
    loading,
    error,
    createFolder,
    updateFolder,
    deleteFolder,
    moveFolder,
  } = useFolders();

  // Use prop folders if provided, otherwise use hook folders
  const folders = propFolders || hookFolders;

  // Build folder hierarchy
  const buildFolderHierarchy = (folders: Folder[]) => {
    const folderMap = new Map<string, Folder>();
    const rootFolders: Folder[] = [];

    // Create a map of all folders
    folders.forEach(folder => {
      folderMap.set(folder.id, folder);
    });

    // Separate root folders and build hierarchy
    folders.forEach(folder => {
      if (!folder.parentId) {
        rootFolders.push(folder);
      }
    });

    return { folderMap, rootFolders };
  };

  const { folderMap, rootFolders } = buildFolderHierarchy(folders);

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleFolderSelect = (folderId?: string) => {
    onFolderSelect?.(folderId);
  };

  const getChildFolders = (parentId: string): Folder[] => {
    return folders.filter(folder => folder.parentId === parentId);
  };

  const handleCreateFolder = async (name: string, parentId?: string) => {
    try {
      await createFolder({ name, parentId });
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  };

  const handleEditFolder = async (folderId: string, newName: string) => {
    try {
      await updateFolder({ id: folderId, name: newName });
    } catch (error) {
      console.error('Failed to edit folder:', error);
      throw error;
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder(folderId);
    } catch (error) {
      console.error('Failed to delete folder:', error);
      throw error;
    }
  };

  const handleMoveFolder = async (folderId: string, newParentId?: string) => {
    try {
      await moveFolder(folderId, newParentId);
    } catch (error) {
      console.error('Failed to move folder:', error);
      throw error;
    }
  };

  const renderFolderTree = (folderList: Folder[], level: number = 0): React.ReactNode => {
    return folderList
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(folder => {
        const childFolders = getChildFolders(folder.id);
        const isExpanded = expandedFolders.has(folder.id);
        const isSelected = selectedFolderId === folder.id;

        return (
          <div key={folder.id}>
            <FolderItem
              folder={folder}
              level={level}
              isExpanded={isExpanded}
              isSelected={isSelected}
              hasChildren={childFolders.length > 0}
              onToggle={() => toggleFolder(folder.id)}
              onSelect={() => handleFolderSelect(folder.id)}
              onCreate={showManagement ? handleCreateFolder : undefined}
              onEdit={showManagement ? handleEditFolder : undefined}
              onDelete={showManagement ? handleDeleteFolder : undefined}
              onMove={showManagement ? handleMoveFolder : undefined}
              availableFolders={folders}
            />
            {isExpanded && childFolders.length > 0 && (
              <div className="ml-4">
                {renderFolderTree(childFolders, level + 1)}
              </div>
            )}
          </div>
        );
      });
  };

  if (loading) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
          Loading folders...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-1", className)}>
        <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-destructive">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {/* All Recipes option */}
      <FolderItem
        folder={null}
        level={0}
        isExpanded={false}
        isSelected={selectedFolderId === undefined}
        hasChildren={false}
        onToggle={() => {}}
        onSelect={() => handleFolderSelect(undefined)}
        onCreate={showManagement ? handleCreateFolder : undefined}
        availableFolders={folders}
        showAllRecipes
      />
      
      {/* Folder tree */}
      {renderFolderTree(rootFolders)}
    </div>
  );
}
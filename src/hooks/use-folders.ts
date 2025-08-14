'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  Folder,
  CreateFolderInput,
  UpdateFolderInput,
} from '@/lib/types';
import {
  getAllFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  getFolderById,
  StorageError,
} from '@/lib/storage';

export interface UseFoldersReturn {
  folders: Folder[];
  loading: boolean;
  error: string | null;
  createFolder: (input: CreateFolderInput) => Promise<Folder>;
  updateFolder: (input: UpdateFolderInput) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<boolean>;
  getFolderById: (id: string) => Folder | null;
  getFolderTree: () => FolderTreeNode[];
  getFolderPath: (folderId: string) => Folder[];
  moveFolder: (folderId: string, newParentId?: string) => Promise<Folder>;
  refreshFolders: () => void;
}

export interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
  level: number;
}

export function useFolders(): UseFoldersReturn {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load folders from storage
  const loadFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allFolders = getAllFolders();
      setFolders(allFolders);
    } catch (err) {
      const errorMessage = err instanceof StorageError 
        ? err.message 
        : 'Failed to load folders';
      setError(errorMessage);
      console.error('Error loading folders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize folders on first render
  React.useEffect(() => {
    loadFolders();
  }, [loadFolders]);

  // Create a new folder
  const handleCreateFolder = useCallback(async (input: CreateFolderInput): Promise<Folder> => {
    try {
      setLoading(true);
      setError(null);
      
      const newFolder = createFolder(input);
      setFolders(prev => [...prev, newFolder]);
      
      return newFolder;
    } catch (err) {
      const errorMessage = err instanceof StorageError 
        ? err.message 
        : 'Failed to create folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing folder
  const handleUpdateFolder = useCallback(async (input: UpdateFolderInput): Promise<Folder> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedFolder = updateFolder(input);
      setFolders(prev => 
        prev.map(folder => 
          folder.id === input.id ? updatedFolder : folder
        )
      );
      
      return updatedFolder;
    } catch (err) {
      const errorMessage = err instanceof StorageError 
        ? err.message 
        : 'Failed to update folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a folder
  const handleDeleteFolder = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      const success = deleteFolder(id);
      if (success) {
        // Reload all folders to get updated hierarchy after deletion
        const allFolders = getAllFolders();
        setFolders(allFolders);
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof StorageError 
        ? err.message 
        : 'Failed to delete folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get folder by ID
  const handleGetFolderById = useCallback((id: string): Folder | null => {
    return getFolderById(id);
  }, []);

  // Move folder to a new parent
  const handleMoveFolder = useCallback(async (folderId: string, newParentId?: string): Promise<Folder> => {
    try {
      setLoading(true);
      setError(null);
      
      const updatedFolder = updateFolder({
        id: folderId,
        parentId: newParentId,
      });
      
      // Reload all folders to get updated hierarchy
      const allFolders = getAllFolders();
      setFolders(allFolders);
      
      return updatedFolder;
    } catch (err) {
      const errorMessage = err instanceof StorageError 
        ? err.message 
        : 'Failed to move folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Build hierarchical folder tree
  const getFolderTree = useCallback((): FolderTreeNode[] => {
    const buildTree = (parentId?: string, level: number = 0): FolderTreeNode[] => {
      return folders
        .filter(folder => folder.parentId === parentId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(folder => ({
          folder,
          children: buildTree(folder.id, level + 1),
          level,
        }));
    };

    return buildTree();
  }, [folders]);

  // Get folder path (breadcrumb trail)
  const getFolderPath = useCallback((folderId: string): Folder[] => {
    const path: Folder[] = [];
    let currentFolder = folders.find(f => f.id === folderId);
    
    while (currentFolder) {
      path.unshift(currentFolder);
      currentFolder = currentFolder.parentId 
        ? folders.find(f => f.id === currentFolder!.parentId)
        : undefined;
    }
    
    return path;
  }, [folders]);

  // Refresh folders from storage
  const refreshFolders = useCallback(() => {
    loadFolders();
  }, [loadFolders]);

  return {
    folders,
    loading,
    error,
    createFolder: handleCreateFolder,
    updateFolder: handleUpdateFolder,
    deleteFolder: handleDeleteFolder,
    getFolderById: handleGetFolderById,
    getFolderTree,
    getFolderPath,
    moveFolder: handleMoveFolder,
    refreshFolders,
  };
}
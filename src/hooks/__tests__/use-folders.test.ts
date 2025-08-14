import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useFolders } from '../use-folders';
import { StorageError } from '@/lib/storage';
import { Folder, CreateFolderInput, UpdateFolderInput } from '@/lib/types';
import * as storage from '@/lib/storage';

// Mock the storage module
vi.mock('@/lib/storage', () => ({
  getAllFolders: vi.fn(),
  createFolder: vi.fn(),
  updateFolder: vi.fn(),
  deleteFolder: vi.fn(),
  getFolderById: vi.fn(),
  StorageError: class StorageError extends Error {
    constructor(message: string, public operation: string, public cause?: Error) {
      super(message);
      this.name = 'StorageError';
    }
  },
}));

const mockFolders: Folder[] = [
  {
    id: '1',
    name: 'Main Dishes',
    children: ['2', '3'],
    recipes: ['recipe1'],
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    name: 'Pasta',
    parentId: '1',
    children: [],
    recipes: ['recipe2', 'recipe3'],
    createdAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    name: 'Meat',
    parentId: '1',
    children: [],
    recipes: ['recipe4'],
    createdAt: new Date('2024-01-03'),
  },
  {
    id: '4',
    name: 'Desserts',
    children: [],
    recipes: ['recipe5'],
    createdAt: new Date('2024-01-04'),
  },
];

describe('useFolders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (storage.getAllFolders as any).mockReturnValue(mockFolders);
  });

  it('loads folders on initialization', async () => {
    const { result } = renderHook(() => useFolders());

    expect(storage.getAllFolders).toHaveBeenCalled();
    expect(result.current.folders).toEqual(mockFolders);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('creates a new folder successfully', async () => {
    const newFolder: Folder = {
      id: '5',
      name: 'Appetizers',
      children: [],
      recipes: [],
      createdAt: new Date('2024-01-05'),
    };

    (storage.createFolder as any).mockReturnValue(newFolder);

    const { result } = renderHook(() => useFolders());

    const createInput: CreateFolderInput = {
      name: 'Appetizers',
    };

    let createdFolder: Folder;
    await act(async () => {
      createdFolder = await result.current.createFolder(createInput);
    });

    expect(storage.createFolder).toHaveBeenCalledWith(createInput);
    expect(createdFolder!).toEqual(newFolder);
    expect(result.current.folders).toContain(newFolder);
    expect(result.current.error).toBe(null);
  });

  it('handles folder creation error', async () => {
    const error = new StorageError('Failed to create folder', 'createFolder');
    (storage.createFolder as any).mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useFolders());

    const createInput: CreateFolderInput = {
      name: 'Test Folder',
    };

    await act(async () => {
      try {
        await result.current.createFolder(createInput);
      } catch (err) {
        expect(err).toBeInstanceOf(Error);
      }
    });

    expect(result.current.error).toBe('Failed to create folder');
  });

  it('updates a folder successfully', async () => {
    const updatedFolder: Folder = {
      ...mockFolders[0],
      name: 'Updated Main Dishes',
    };

    (storage.updateFolder as any).mockReturnValue(updatedFolder);

    const { result } = renderHook(() => useFolders());

    const updateInput: UpdateFolderInput = {
      id: '1',
      name: 'Updated Main Dishes',
    };

    let updated: Folder;
    await act(async () => {
      updated = await result.current.updateFolder(updateInput);
    });

    expect(storage.updateFolder).toHaveBeenCalledWith(updateInput);
    expect(updated!).toEqual(updatedFolder);
    expect(result.current.folders.find(f => f.id === '1')?.name).toBe('Updated Main Dishes');
    expect(result.current.error).toBe(null);
  });

  it('deletes a folder successfully', async () => {
    (storage.deleteFolder as any).mockReturnValue(true);
    (storage.getAllFolders as any).mockReturnValue(mockFolders.filter(f => f.id !== '4'));

    const { result } = renderHook(() => useFolders());

    let success: boolean;
    await act(async () => {
      success = await result.current.deleteFolder('4');
    });

    expect(storage.deleteFolder).toHaveBeenCalledWith('4');
    expect(success!).toBe(true);
    expect(result.current.folders.find(f => f.id === '4')).toBeUndefined();
    expect(result.current.error).toBe(null);
  });

  it('gets folder by ID', () => {
    (storage.getFolderById as any).mockReturnValue(mockFolders[0]);

    const { result } = renderHook(() => useFolders());

    const folder = result.current.getFolderById('1');

    expect(storage.getFolderById).toHaveBeenCalledWith('1');
    expect(folder).toEqual(mockFolders[0]);
  });

  it('builds folder tree correctly', () => {
    const { result } = renderHook(() => useFolders());

    const tree = result.current.getFolderTree();

    expect(tree).toHaveLength(2); // Main Dishes and Desserts at root level
    
    const mainDishes = tree.find(node => node.folder.name === 'Main Dishes');
    expect(mainDishes).toBeDefined();
    expect(mainDishes!.children).toHaveLength(2); // Pasta and Meat
    expect(mainDishes!.level).toBe(0);
    
    const pasta = mainDishes!.children.find(node => node.folder.name === 'Pasta');
    expect(pasta).toBeDefined();
    expect(pasta!.level).toBe(1);
    expect(pasta!.children).toHaveLength(0);
    
    const desserts = tree.find(node => node.folder.name === 'Desserts');
    expect(desserts).toBeDefined();
    expect(desserts!.children).toHaveLength(0);
    expect(desserts!.level).toBe(0);
  });

  it('gets folder path correctly', () => {
    const { result } = renderHook(() => useFolders());

    const path = result.current.getFolderPath('2'); // Pasta folder

    expect(path).toHaveLength(2);
    expect(path[0].name).toBe('Main Dishes');
    expect(path[1].name).toBe('Pasta');
  });

  it('gets empty path for root folder', () => {
    const { result } = renderHook(() => useFolders());

    const path = result.current.getFolderPath('1'); // Main Dishes (root level)

    expect(path).toHaveLength(1);
    expect(path[0].name).toBe('Main Dishes');
  });

  it('moves folder to new parent successfully', async () => {
    const movedFolder: Folder = {
      ...mockFolders[3], // Desserts
      parentId: '1', // Move under Main Dishes
    };

    (storage.updateFolder as any).mockReturnValue(movedFolder);
    (storage.getAllFolders as any).mockReturnValue([
      ...mockFolders.slice(0, 3),
      movedFolder,
    ]);

    const { result } = renderHook(() => useFolders());

    let moved: Folder;
    await act(async () => {
      moved = await result.current.moveFolder('4', '1');
    });

    expect(storage.updateFolder).toHaveBeenCalledWith({
      id: '4',
      parentId: '1',
    });
    expect(moved!).toEqual(movedFolder);
    expect(result.current.error).toBe(null);
  });

  it('moves folder to root level', async () => {
    const movedFolder: Folder = {
      ...mockFolders[1], // Pasta
      parentId: undefined, // Move to root
    };

    (storage.updateFolder as any).mockReturnValue(movedFolder);
    (storage.getAllFolders as any).mockReturnValue([
      mockFolders[0],
      movedFolder,
      mockFolders[2],
      mockFolders[3],
    ]);

    const { result } = renderHook(() => useFolders());

    let moved: Folder;
    await act(async () => {
      moved = await result.current.moveFolder('2'); // No parent ID = move to root
    });

    expect(storage.updateFolder).toHaveBeenCalledWith({
      id: '2',
      parentId: undefined,
    });
    expect(moved!).toEqual(movedFolder);
    expect(result.current.error).toBe(null);
  });

  it('refreshes folders from storage', async () => {
    const { result } = renderHook(() => useFolders());

    // Clear the mock call count
    vi.clearAllMocks();

    await act(async () => {
      result.current.refreshFolders();
    });

    expect(storage.getAllFolders).toHaveBeenCalled();
  });

  it('handles storage errors gracefully', async () => {
    const error = new StorageError('Storage error', 'getAllFolders');
    (storage.getAllFolders as any).mockImplementation(() => {
      throw error;
    });

    const { result } = renderHook(() => useFolders());

    await act(async () => {
      result.current.refreshFolders();
    });

    expect(result.current.error).toBe('Storage error');
    expect(result.current.folders).toEqual([]);
  });
});
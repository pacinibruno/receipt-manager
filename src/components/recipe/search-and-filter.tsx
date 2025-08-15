'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  X,
  Clock,
  ChefHat,
  Users,
} from 'lucide-react';
import { SearchFilters, DifficultyLevel } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SearchAndFilterProps {
  availableTags: string[];
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  placeholder?: string;
  className?: string;
}

export function SearchAndFilter({
  availableTags,
  filters,
  onFiltersChange,
  placeholder = "Search recipes...",
  className
}: SearchAndFilterProps) {
  const [searchQuery, setSearchQuery] = useState(filters.query || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(filters.tags || []);
  const [selectedDifficulties, setSelectedDifficulties] = useState<DifficultyLevel[]>(
    filters.difficulty || []
  );
  const [prepTimeMax, setPrepTimeMax] = useState<number | undefined>(filters.prepTimeMax);
  const [cookTimeMax, setCookTimeMax] = useState<number | undefined>(filters.cookTimeMax);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({
        ...filters,
        query: searchQuery || undefined,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update filters when other values change
  useEffect(() => {
    onFiltersChange({
      ...filters,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      difficulty: selectedDifficulties.length > 0 ? selectedDifficulties : undefined,
      prepTimeMax,
      cookTimeMax,
    });
  }, [selectedTags, selectedDifficulties, prepTimeMax, cookTimeMax]);

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleDifficultyToggle = (difficulty: DifficultyLevel) => {
    setSelectedDifficulties(prev =>
      prev.includes(difficulty)
        ? prev.filter(d => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedDifficulties([]);
    setPrepTimeMax(undefined);
    setCookTimeMax(undefined);
    onFiltersChange({});
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const handleRemoveDifficulty = (difficulty: DifficultyLevel) => {
    setSelectedDifficulties(prev => prev.filter(d => d !== difficulty));
  };

  const hasActiveFilters = useMemo(() => {
    return !!(
      searchQuery ||
      selectedTags.length > 0 ||
      selectedDifficulties.length > 0 ||
      prepTimeMax ||
      cookTimeMax
    );
  }, [searchQuery, selectedTags, selectedDifficulties, prepTimeMax, cookTimeMax]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery) count++;
    if (selectedTags.length > 0) count++;
    if (selectedDifficulties.length > 0) count++;
    if (prepTimeMax) count++;
    if (cookTimeMax) count++;
    return count;
  }, [searchQuery, selectedTags, selectedDifficulties, prepTimeMax, cookTimeMax]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-4"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            onClick={() => setSearchQuery('')}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        {/* Tags Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <Filter className="mr-2 h-3 w-3" />
              Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Filter by Tags</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableTags.length > 0 ? (
              availableTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={selectedTags.includes(tag)}
                  onCheckedChange={() => handleTagToggle(tag)}
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No tags available
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Difficulty Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <ChefHat className="mr-2 h-3 w-3" />
              Difficulty
              {selectedDifficulties.length > 0 && (
                <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                  {selectedDifficulties.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filter by Difficulty</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(['Easy', 'Medium', 'Hard'] as DifficultyLevel[]).map((difficulty) => (
              <DropdownMenuCheckboxItem
                key={difficulty}
                checked={selectedDifficulties.includes(difficulty)}
                onCheckedChange={() => handleDifficultyToggle(difficulty)}
              >
                {difficulty}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Prep Time Filter */}
        <Select
          value={prepTimeMax?.toString() || 'any'}
          onValueChange={(value) => setPrepTimeMax(value === 'any' ? undefined : parseInt(value))}
        >
          <SelectTrigger className="w-auto h-8">
            <Clock className="mr-2 h-3 w-3" />
            <SelectValue placeholder="Prep time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any prep time</SelectItem>
            <SelectItem value="15">≤ 15 min</SelectItem>
            <SelectItem value="30">≤ 30 min</SelectItem>
            <SelectItem value="60">≤ 1 hour</SelectItem>
            <SelectItem value="120">≤ 2 hours</SelectItem>
          </SelectContent>
        </Select>

        {/* Cook Time Filter */}
        <Select
          value={cookTimeMax?.toString() || 'any'}
          onValueChange={(value) => setCookTimeMax(value === 'any' ? undefined : parseInt(value))}
        >
          <SelectTrigger className="w-auto h-8">
            <Users className="mr-2 h-3 w-3" />
            <SelectValue placeholder="Cook time" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any cook time</SelectItem>
            <SelectItem value="15">≤ 15 min</SelectItem>
            <SelectItem value="30">≤ 30 min</SelectItem>
            <SelectItem value="60">≤ 1 hour</SelectItem>
            <SelectItem value="120">≤ 2 hours</SelectItem>
            <SelectItem value="240">≤ 4 hours</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <X className="mr-2 h-3 w-3" />
            Clear all
            {activeFilterCount > 1 && (
              <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}
      </div>

      {/* Active Filter Tags */}
      {(selectedTags.length > 0 || selectedDifficulties.length > 0) && (
        <div className="flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => handleRemoveTag(tag)}
            >
              {tag}
              <X className="ml-1 h-2 w-2" />
            </Badge>
          ))}
          {selectedDifficulties.map((difficulty) => (
            <Badge
              key={difficulty}
              variant="secondary"
              className="text-xs cursor-pointer hover:bg-secondary/80"
              onClick={() => handleRemoveDifficulty(difficulty)}
            >
              {difficulty}
              <X className="ml-1 h-2 w-2" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
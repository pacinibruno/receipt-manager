import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateId,
  generateRecipeId,
  generateFolderId,
  generateTagId,
  generateIngredientId,
  getCurrentTimestamp,
  formatDate,
  formatDateTime,
  formatTimeAgo,
  isValidDate,
  parseDate,
  formatDuration,
  parseDuration,
  capitalizeFirst,
  slugify,
  removeDuplicates,
  sortByProperty,
  normalizeSearchTerm,
  createSearchRegex,
  highlightSearchTerm,
  isString,
  isNumber,
  isArray,
  isDefined,
} from '../utils';

describe('ID generation utilities', () => {
  it('should generate unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(0);
  });

  it('should generate recipe IDs with prefix', () => {
    const id = generateRecipeId();
    expect(id).toMatch(/^recipe_/);
  });

  it('should generate folder IDs with prefix', () => {
    const id = generateFolderId();
    expect(id).toMatch(/^folder_/);
  });

  it('should generate tag IDs with prefix', () => {
    const id = generateTagId();
    expect(id).toMatch(/^tag_/);
  });

  it('should generate ingredient IDs with prefix', () => {
    const id = generateIngredientId();
    expect(id).toMatch(/^ingredient_/);
  });
});

describe('Date handling utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should get current timestamp', () => {
    const mockDate = new Date('2023-01-01T12:00:00Z');
    vi.setSystemTime(mockDate);
    
    const timestamp = getCurrentTimestamp();
    expect(timestamp).toEqual(mockDate);
  });

  it('should format date', () => {
    const date = new Date('2023-01-15T12:00:00Z');
    const formatted = formatDate(date);
    expect(formatted).toBe('January 15, 2023');
  });

  it('should format date time', () => {
    const date = new Date('2023-01-15T14:30:00Z');
    const formatted = formatDateTime(date);
    expect(formatted).toMatch(/January 15, 2023/);
    // Time formatting can vary by timezone, just check it contains time
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/);
  });

  it('should format time ago for recent times', () => {
    const now = new Date('2023-01-01T12:00:00Z');
    vi.setSystemTime(now);

    expect(formatTimeAgo(new Date('2023-01-01T11:59:30Z'))).toBe('just now');
    expect(formatTimeAgo(new Date('2023-01-01T11:59:00Z'))).toBe('1 minute ago');
    expect(formatTimeAgo(new Date('2023-01-01T11:30:00Z'))).toBe('30 minutes ago');
    expect(formatTimeAgo(new Date('2023-01-01T11:00:00Z'))).toBe('1 hour ago');
    expect(formatTimeAgo(new Date('2022-12-31T12:00:00Z'))).toBe('1 day ago');
    expect(formatTimeAgo(new Date('2022-12-25T12:00:00Z'))).toBe('1 week ago');
  });

  it('should validate dates', () => {
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate(new Date('2023-01-01'))).toBe(true);
    expect(isValidDate(new Date('invalid'))).toBe(false);
    expect(isValidDate('not a date')).toBe(false);
    expect(isValidDate(null)).toBe(false);
  });

  it('should parse date strings', () => {
    expect(parseDate('2023-01-01')).toEqual(new Date('2023-01-01'));
    expect(parseDate('invalid')).toBe(null);
    expect(parseDate('')).toBe(null);
  });
});

describe('Data transformation utilities', () => {
  it('should format duration', () => {
    expect(formatDuration(30)).toBe('30 min');
    expect(formatDuration(60)).toBe('1 hr');
    expect(formatDuration(90)).toBe('1 hr 30 min');
    expect(formatDuration(120)).toBe('2 hrs');
    expect(formatDuration(150)).toBe('2 hrs 30 min');
  });

  it('should parse duration strings', () => {
    expect(parseDuration('30 min')).toBe(30);
    expect(parseDuration('1 hr')).toBe(60);
    expect(parseDuration('1 hr 30 min')).toBe(90);
    expect(parseDuration('2 hrs')).toBe(120);
    expect(parseDuration('invalid')).toBe(null);
  });

  it('should capitalize first letter', () => {
    expect(capitalizeFirst('hello')).toBe('Hello');
    expect(capitalizeFirst('HELLO')).toBe('Hello');
    expect(capitalizeFirst('hELLO')).toBe('Hello');
    expect(capitalizeFirst('')).toBe('');
  });

  it('should create slugs', () => {
    expect(slugify('Hello World')).toBe('hello-world');
    expect(slugify('Hello, World!')).toBe('hello-world');
    expect(slugify('  Hello   World  ')).toBe('hello-world');
    expect(slugify('Hello_World')).toBe('hello-world');
  });
});

describe('Array utilities', () => {
  it('should remove duplicates', () => {
    expect(removeDuplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    expect(removeDuplicates([])).toEqual([]);
  });

  it('should sort by property', () => {
    const items = [
      { name: 'Charlie', age: 30 },
      { name: 'Alice', age: 25 },
      { name: 'Bob', age: 35 },
    ];

    const sortedByName = sortByProperty(items, 'name');
    expect(sortedByName.map(item => item.name)).toEqual(['Alice', 'Bob', 'Charlie']);

    const sortedByAgeDesc = sortByProperty(items, 'age', 'desc');
    expect(sortedByAgeDesc.map(item => item.age)).toEqual([35, 30, 25]);
  });
});

describe('Search utilities', () => {
  it('should normalize search terms', () => {
    expect(normalizeSearchTerm('  Hello World  ')).toBe('hello world');
    expect(normalizeSearchTerm('HELLO   WORLD')).toBe('hello world');
  });

  it('should create search regex', () => {
    const regex = createSearchRegex('hello');
    expect(regex.test('Hello World')).toBe(true);
    expect(regex.test('world')).toBe(false);
  });

  it('should escape special regex characters', () => {
    const regex = createSearchRegex('hello.world');
    expect(regex.test('hello.world')).toBe(true);
    expect(regex.test('helloXworld')).toBe(false);
  });

  it('should highlight search terms', () => {
    expect(highlightSearchTerm('Hello World', 'hello')).toBe('<mark>Hello</mark> World');
    expect(highlightSearchTerm('Hello World', 'world')).toBe('Hello <mark>World</mark>');
    expect(highlightSearchTerm('Hello World', '')).toBe('Hello World');
  });
});

describe('Type guards', () => {
  it('should check if value is string', () => {
    expect(isString('hello')).toBe(true);
    expect(isString(123)).toBe(false);
    expect(isString(null)).toBe(false);
    expect(isString(undefined)).toBe(false);
  });

  it('should check if value is number', () => {
    expect(isNumber(123)).toBe(true);
    expect(isNumber(123.45)).toBe(true);
    expect(isNumber('123')).toBe(false);
    expect(isNumber(NaN)).toBe(false);
  });

  it('should check if value is array', () => {
    expect(isArray([])).toBe(true);
    expect(isArray([1, 2, 3])).toBe(true);
    expect(isArray('not array')).toBe(false);
    expect(isArray(null)).toBe(false);
  });

  it('should check if value is defined', () => {
    expect(isDefined('hello')).toBe(true);
    expect(isDefined(0)).toBe(true);
    expect(isDefined(false)).toBe(true);
    expect(isDefined(null)).toBe(false);
    expect(isDefined(undefined)).toBe(false);
  });
});
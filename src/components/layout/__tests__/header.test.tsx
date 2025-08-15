import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { useRouter, usePathname } from 'next/navigation';
import { Header } from '../header';
import { vi } from 'vitest';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { it } from 'node:test';
import { beforeEach } from 'node:test';
import { describe } from 'node:test';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

const mockPush = vi.fn();
const mockUseRouter = useRouter as any;
const mockUsePathname = usePathname as any;

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  it('renders header with branding', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<Header />);
    
    expect(screen.getByText('Recipe Manager')).toBeInTheDocument();
    expect(screen.getByText('Organize your culinary creations')).toBeInTheDocument();
    expect(screen.getByLabelText('Go to home page')).toBeInTheDocument();
  });

  it('shows add recipe button by default', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<Header />);
    
    expect(screen.getByRole('button', { name: /add recipe/i })).toBeInTheDocument();
  });

  it('hides add recipe button when showAddButton is false', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<Header showAddButton={false} />);
    
    expect(screen.queryByRole('button', { name: /add recipe/i })).not.toBeInTheDocument();
  });

  it('calls onAddRecipe when add button is clicked', () => {
    mockUsePathname.mockReturnValue('/');
    const mockOnAddRecipe = vi.fn();
    
    render(<Header onAddRecipe={mockOnAddRecipe} />);
    
    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }));
    
    expect(mockOnAddRecipe).toHaveBeenCalledTimes(1);
  });

  it('navigates to home when logo is clicked', () => {
    mockUsePathname.mockReturnValue('/recipe/123');
    
    render(<Header />);
    
    fireEvent.click(screen.getByLabelText('Go to home page'));
    
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('highlights home navigation when on home page', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<Header />);
    
    const homeLink = screen.getByRole('link', { name: /all recipes/i });
    expect(homeLink).toHaveClass('bg-primary');
  });

  it('does not highlight home navigation when on other pages', () => {
    mockUsePathname.mockReturnValue('/recipe/123');
    
    render(<Header />);
    
    const homeLink = screen.getByRole('link', { name: /all recipes/i });
    expect(homeLink).not.toHaveClass('bg-primary');
  });

  it('opens mobile menu when menu button is clicked', async () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<Header />);
    
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(menuButton);
    
    // Check that the sheet is opened by looking for the mobile navigation content
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('shows mobile navigation items in mobile menu', async () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<Header />);
    
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      // Check that the mobile menu dialog is open
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      // Check for mobile-specific content within the dialog
      expect(within(dialog).getByText('Recipe Manager')).toBeInTheDocument();
    });
  });

  it('closes mobile menu when navigation item is clicked', async () => {
    mockUsePathname.mockReturnValue('/recipe/123');
    
    render(<Header />);
    
    // Open mobile menu
    const menuButton = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Find and click the mobile navigation link within the dialog
    const dialog = screen.getByRole('dialog');
    const mobileLink = within(dialog).getByRole('link', { name: /all recipes/i });
    fireEvent.click(mobileLink);
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    mockUsePathname.mockReturnValue('/');
    
    const { container } = render(<Header className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('navigates to home when add recipe is clicked and no handler provided', () => {
    mockUsePathname.mockReturnValue('/recipe/123');
    
    render(<Header />);
    
    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }));
    
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('does not navigate when add recipe is clicked on home page without handler', () => {
    mockUsePathname.mockReturnValue('/');
    
    render(<Header />);
    
    fireEvent.click(screen.getByRole('button', { name: /add recipe/i }));
    
    expect(mockPush).not.toHaveBeenCalled();
  });
});
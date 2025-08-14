# Recipe Management System

A modern web application for organizing, categorizing, and managing recipes with a hierarchical folder structure and tagging system.

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Data Storage**: Local storage (with future database integration capability)
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Available Scripts

- `npm run dev` - Start the development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page (recipe list)
│   ├── recipe/
│   │   └── [id]/
│   │       └── page.tsx           # Individual recipe page
│   └── globals.css
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── recipe/                    # Recipe-specific components
│   ├── folder/                    # Folder management components
│   └── layout/                    # Layout components
├── lib/
│   ├── utils.ts                   # Utility functions
│   └── types.ts                   # TypeScript type definitions
└── hooks/                         # Custom React hooks
```

## Features (Planned)

- ✅ Project foundation and infrastructure
- 🔄 Recipe CRUD operations
- 🔄 Hierarchical folder organization
- 🔄 Tag-based categorization
- 🔄 Search and filtering
- 🔄 Responsive design
- 🔄 Local storage persistence

## Development

This project follows a spec-driven development approach. See the `.kiro/specs/recipe-management/` directory for detailed requirements, design, and implementation tasks.

## Contributing

1. Follow the existing code style (enforced by Prettier and ESLint)
2. Write TypeScript with strict type checking
3. Use shadcn/ui components for consistency
4. Follow the established project structure

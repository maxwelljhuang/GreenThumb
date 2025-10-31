# Knytt Frontend

AI-powered product discovery platform frontend built with Next.js 14, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Form Handling**: React Hook Form + Zod
- **Code Quality**: ESLint + Prettier

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── layout/      # Header, Footer, Sidebar
│   ├── product/     # ProductCard, ProductGrid
│   ├── search/      # SearchBar, FilterPanel
│   ├── onboarding/  # Onboarding flow components
│   ├── common/      # Shared components
│   └── ui/          # Base UI components (Shadcn/ui)
├── lib/             # Utilities and API clients
│   ├── api/         # API client layer
│   ├── queries/     # React Query hooks
│   └── utils/       # Utility functions
├── hooks/           # Custom React hooks
├── stores/          # Zustand stores
├── types/           # TypeScript type definitions
└── styles/          # Global styles
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL` - Backend API URL (default: http://localhost:8001)
- `NEXT_PUBLIC_APP_ENV` - Environment (development/staging/production)

## Development Setup Complete ✅

Phase 1.1 completed:
- ✅ Next.js 14+ project initialized with TypeScript
- ✅ Tailwind CSS v4 configured
- ✅ Core dependencies installed (React Query, Zustand, Zod)
- ✅ Dev dependencies installed (Prettier, ESLint)
- ✅ Project structure created
- ✅ Configuration files set up
- ✅ Environment template created

## Next Steps

1. Create type definitions from backend API
2. Build API client layer
3. Set up React Query providers
4. Implement core components
5. Build authentication flow
6. Create onboarding experience
7. Implement search and discovery features

## Backend API

The frontend connects to the Knytt backend API:
- **Base URL**: http://localhost:8001
- **Docs**: http://localhost:8001/docs

### Key Endpoints
- `POST /api/v1/search` - Semantic product search
- `POST /api/v1/recommend` - Personalized recommendations
- `POST /api/v1/feedback` - User interaction tracking

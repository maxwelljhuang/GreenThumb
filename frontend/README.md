# GreenThumb Frontend

A Pinterest-style frontend built with Next.js 14, featuring TikTok-style onboarding, infinite scroll recommendations, and AI-powered search with explainable results.

## 🎨 Design System

### Color Palette
- **Sand** (#f5f5d5) - Background
- **Dune** (#c7b793) - Borders, muted
- **Sage** (#a3b68a) - Subtle fills
- **Pine** (#5c724a) - Primary CTAs
- **Forest** (#354a2f) - Hover, dark text

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Home page
│   ├── feed/             # Feed page
│   ├── onboard/          # Onboarding page
│   └── search/           # Search page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── feed/             # Feed components
│   ├── onboard/          # Onboarding components
│   └── search/           # Search components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
└── store/                # State management
```

## 🎯 Features

### Core Pages
- **/** - Home (redirects to feed)
- **/onboard** - Style quiz with moodboard selection
- **/feed** - Infinite scroll recommendations
- **/search** - Text-based discovery with attribution

### Key Components
- **Masonry Layout** - Pinterest-style grid
- **Pin Cards** - Product cards with hover effects
- **Moodboard Selection** - TikTok-style onboarding
- **Search with Attribution** - "Because you liked..." explanations
- **Infinite Scroll** - Smooth loading experience

### Design Features
- Responsive masonry layout (1-6 columns)
- Smooth animations and transitions
- Hover effects and micro-interactions
- Loading states and skeletons
- Accessibility-first design

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:e2e     # Run E2E tests
```

### Code Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling

## 🎨 Customization

### Adding New Colors
Update `tailwind.config.ts` and `globals.css`:

```typescript
// tailwind.config.ts
colors: {
  yourColor: {
    DEFAULT: '#your-hex',
    50: '#lightest',
    900: '#darkest',
  }
}
```

### Adding New Components
Create components in `src/components/ui/` following the existing patterns:

```typescript
// src/components/ui/your-component.tsx
import { cn } from '@/lib/utils'

export function YourComponent({ className, ...props }) {
  return (
    <div className={cn("base-styles", className)} {...props} />
  )
}
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: 320px - 640px (1 column)
- **Tablet**: 640px - 1024px (2-3 columns)
- **Desktop**: 1024px - 1280px (4 columns)
- **Large**: 1280px+ (6 columns)

### Mobile-First Approach
- Touch-friendly interactions
- Optimized loading for mobile
- Progressive enhancement

## 🔧 Configuration

### Environment Variables
Create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=GreenThumb
```

### API Integration
The frontend is configured to proxy API requests to the backend:

```javascript
// next.config.js
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:8000/api/:path*',
    },
  ]
}
```

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Configure environment variables
3. Deploy automatically on push

### Manual Deployment
```bash
npm run build
npm start
```

## 📊 Performance

### Optimization Features
- Image optimization with Next.js Image
- Code splitting and lazy loading
- Bundle size optimization
- Core Web Vitals optimization

### Performance Targets
- Lighthouse Score: 90+
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Cumulative Layout Shift: <0.1

## 🧪 Testing

### Test Structure
- **Unit Tests** - Component testing with Jest + RTL
- **E2E Tests** - Full user flows with Playwright
- **Visual Tests** - Component stories with Storybook

### Running Tests
```bash
npm run test         # Unit tests
npm run test:e2e     # E2E tests
npm run storybook   # Visual testing
```

## 📚 Documentation

- [Component Documentation](./docs/components.md)
- [API Integration](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guide](./docs/contributing.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.
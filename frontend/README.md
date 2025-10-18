# GreenThumb Discovery Frontend

Frontend application for the GreenThumb Discovery MVP.

## Tech Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/          # Next.js app router pages
│   ├── components/   # React components
│   ├── lib/          # Utility functions
│   └── hooks/        # Custom React hooks
├── public/           # Static assets
└── package.json
```

## Development

- Follow React and Next.js best practices
- Use TypeScript for type safety
- Write tests for components
- Follow the style guide

## API Integration

The frontend connects to the backend API at the URL specified in the `API_URL` environment variable.

Default: `http://localhost:8000`


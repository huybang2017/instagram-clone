# Instagram Clone

This is an Instagram clone project built with the [T3 Stack](https://create.t3.gg/), which provides a robust foundation for modern web applications.

## Features

- User authentication with NextAuth.js
- Post creation and interaction
- Responsive design with Tailwind CSS
- Type-safe API calls with tRPC
- Database management with Prisma

## Technologies Used

- [Next.js](https://nextjs.org) - React framework for server-rendered applications
- [NextAuth.js](https://next-auth.js.org) - Authentication for Next.js
- [Prisma](https://prisma.io) - ORM for database access
- [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- [tRPC](https://trpc.io) - End-to-end typesafe APIs

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install` or `pnpm install`
3. Start the database with `./start-database.sh`
4. Run the development server with `npm run dev` or `pnpm dev`

## Development

The project structure follows the T3 Stack conventions:

- `/prisma` - Database schema and migrations
- `/src/app` - Next.js application routes and components
- `/src/server` - Backend API and database connections
- `/src/styles` - Global styles

## Project Structure Review

This project follows a well-organized structure that separates concerns and promotes maintainability:

### Frontend Architecture

- `/src/app` - Contains all Next.js 13+ App Router components and pages
  - `page.tsx` - Main landing page component
  - `layout.tsx` - Root layout that wraps all pages
  - `_components/` - Reusable UI components like posts
  - `api/` - API route handlers for Next.js

### Backend Architecture

- `/src/server` - Server-side code isolated from the frontend
  - `db.ts` - Database client and connection setup
  - `api/` - tRPC API definitions and routers
    - `routers/post.ts` - Post-related API endpoints
  - `auth/` - Authentication configuration with NextAuth.js

### Data Flow

- Type-safe data flow from database to UI using tRPC
- Authentication handled through NextAuth.js
- Database schema defined in Prisma

### Configuration Files

- `next.config.js` - Next.js configuration
- `prisma/schema.prisma` - Database schema definition
- `eslint.config.js` and `prettier.config.js` - Code quality tools
- `start-database.sh` - Database initialization script

This architecture follows modern best practices for fullstack applications, with clear separation of concerns, type safety throughout the codebase, and a modular approach that makes the application easier to maintain and extend.

## Deployment

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

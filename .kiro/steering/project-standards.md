# Project Standards and Guidelines

## Technology Stack
- **Frontend**: Next.js 14 with App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with custom theme configuration
- **Backend**: Next.js API Routes with Prisma ORM
- **Database**: PostgreSQL with connection pooling
- **Authentication**: NextAuth.js with JWT tokens
- **File Storage**: Local file system with organized directory structure
- **Charts**: Chart.js or Recharts for data visualization
- **Testing**: Jest + React Testing Library for unit tests, Playwright for E2E

## Code Quality Standards
- Use TypeScript for all code with strict type checking
- Follow ESLint and Prettier configurations
- Implement proper error handling with try-catch blocks
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Maintain consistent file and folder naming conventions

## Database Standards
- Use UUID for all primary keys
- Include created_at and updated_at timestamps on all tables
- Implement proper foreign key constraints
- Use descriptive column names with snake_case
- Add database indexes for performance optimization
- Use transactions for multi-table operations

## API Design Principles
- Follow RESTful conventions for endpoint naming
- Use proper HTTP status codes (200, 201, 400, 401, 403, 404, 500)
- Implement consistent error response format
- Add request validation using Zod or similar
- Include proper authentication and authorization checks
- Use pagination for list endpoints

## Security Requirements
- Validate all user inputs on both client and server
- Implement proper authentication for all protected routes
- Use role-based access control for team features
- Sanitize file uploads and validate file types
- Implement rate limiting for API endpoints
- Use environment variables for sensitive configuration
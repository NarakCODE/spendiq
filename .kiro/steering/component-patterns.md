# Component Patterns and UI Guidelines

## Component Structure
- Use functional components with hooks
- Implement proper TypeScript interfaces for props
- Follow single responsibility principle
- Create reusable UI components in `components/ui/`
- Use compound component pattern for complex components

## State Management
- Use React Context for global state (user, current team)
- Implement TanStack Query for server state management and caching
- Use useState/useReducer for component-specific state
- Avoid prop drilling by using appropriate state management

## Form Handling
- Use controlled components for form inputs
- Implement proper form validation with error messages
- Create reusable form components and hooks
- Handle loading and error states consistently
- Use optimistic updates where appropriate

## UI/UX Standards
- Follow responsive design principles with mobile-first approach
- Use consistent spacing and typography from Tailwind theme
- Implement proper loading states and skeleton screens
- Add proper error boundaries and fallback UI
- Ensure accessibility with proper ARIA labels and keyboard navigation

## File Organization
```
components/
├── ui/           # Reusable UI components
├── charts/       # Chart components
├── expense/      # Expense-specific components
├── budget/       # Budget-specific components
├── team/         # Team collaboration components
└── layout/       # Layout components
```

## Component Examples
- Button variants: primary, secondary, danger, ghost
- Form components: Input, Select, DatePicker, FileUpload
- Data display: Table, Card, Badge, Progress
- Feedback: Toast, Modal, Alert, Loading
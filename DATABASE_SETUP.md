# Database Setup and Migration Workflow

This document outlines how to set up and manage the PostgreSQL database for SpendIQ using Prisma ORM.

## Initial Setup

1. Make sure PostgreSQL is installed and running on your system
2. Create a new database named `spendiq`:
   ```sql
   CREATE DATABASE spendiq;
   ```
3. Configure your `.env` file with the correct database connection string:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/spendiq?schema=public"
   DIRECT_URL="postgresql://username:password@localhost:5432/spendiq?schema=public"
   ```

## Database Commands

- **Generate Prisma Client**: After making changes to the schema, generate the Prisma client:
  ```
  npm run prisma:generate
  ```

- **Create Migrations**: When you modify the schema, create a migration:
  ```
  npm run prisma:migrate -- --name descriptive_name_of_changes
  ```

- **Apply Migrations**: Apply pending migrations to the database:
  ```
  npm run prisma:migrate
  ```

- **Push Schema Changes**: For development, you can push schema changes without migrations:
  ```
  npm run db:push
  ```

- **Seed Database**: Populate the database with initial data:
  ```
  npm run db:seed
  ```

- **Open Prisma Studio**: View and edit your database with a visual interface:
  ```
  npm run prisma:studio
  ```

## Migration Best Practices

1. Always create migrations for schema changes in development
2. Review migration files before applying them
3. Test migrations on a development database before production
4. Back up production database before applying migrations
5. Use descriptive names for migrations
6. Keep migrations small and focused on specific changes

## Troubleshooting

If you encounter issues with migrations:

1. Check the Prisma migration history:
   ```
   npx prisma migrate status
   ```

2. Reset the database (development only):
   ```
   npx prisma migrate reset
   ```

3. Resolve migration conflicts:
   - Create a new migration that fixes the issues
   - Manually edit the migration SQL if needed
   - Use `--create-only` flag to create migration without applying it
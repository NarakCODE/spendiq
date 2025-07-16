import { exec } from 'child_process';
import { promisify } from 'util';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const execAsync = promisify(exec);

async function createDatabase() {
  try {
    console.log('Attempting to create database...');

    // Extract connection details from DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not defined');
    }

    // Parse the connection string
    const url = new URL(databaseUrl);
    const user = url.username;
    const password = url.password;
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.substring(1); // Remove leading slash

    console.log(`Database name to create: ${database}`);
    console.log(`Host: ${host}:${port}`);

    // Create a connection string without the database name for initial connection
    const baseConnectionString = `postgresql://${user}:${password}@${host}:${port}`;

    // Command to create database
    const createDbCommand = `
      psql "${baseConnectionString}" -c "
        SELECT 'CREATE DATABASE ${database}'
        WHERE NOT EXISTS (
          SELECT FROM pg_database WHERE datname = '${database}'
        )\\gexec
      "
    `;

    console.log('Executing database creation command...');
    const { stdout, stderr } = await execAsync(createDbCommand);

    if (stderr && !stderr.includes('CREATE DATABASE')) {
      console.error('Error output:', stderr);
    }

    console.log('Command output:', stdout);
    console.log('✅ Database creation command executed successfully');

    return true;
  } catch (error) {
    console.error('❌ Failed to create database:');
    console.error(error);

    console.log('\nManual Database Creation Instructions:');
    console.log('1. Connect to your PostgreSQL server using psql or another client');
    console.log('2. Run the following SQL command:');
    console.log('   CREATE DATABASE spendiq;');
    console.log('3. Then try running the test connection script again');

    return false;
  }
}

createDatabase()
  .then((success) => {
    if (success) {
      console.log('Database creation process completed.');
    } else {
      console.log('Database creation process failed.');
      process.exit(1);
    }
  })
  .catch((e) => {
    console.error('Unexpected error:', e);
    process.exit(1);
  });
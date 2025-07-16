import { PrismaClient } from '@prisma/client';

async function testConnection() {
  const prisma = new PrismaClient();

  try {
    console.log('Attempting to connect to the database...');

    // Try a simple query to test the connection
    const result = await prisma.$queryRaw`SELECT 1 as result`;

    console.log('✅ Database connection successful!');
    console.log('Query result:', result);

    // Test database version
    const versionResult = await prisma.$queryRaw`SELECT version() as version`;
    console.log('Database version:', versionResult);

    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

testConnection()
  .then((success) => {
    if (success) {
      console.log('Database connection test completed successfully.');
    } else {
      console.log('Database connection test failed.');
      process.exit(1);
    }
  })
  .catch((e) => {
    console.error('Unexpected error during connection test:', e);
    process.exit(1);
  });
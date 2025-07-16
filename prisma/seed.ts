import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default categories
  const defaultCategories = [
    { name: 'Food & Dining', color: '#FF5733', icon: 'utensils' },
    { name: 'Transportation', color: '#33A8FF', icon: 'car' },
    { name: 'Housing', color: '#33FF57', icon: 'home' },
    { name: 'Entertainment', color: '#D433FF', icon: 'film' },
    { name: 'Shopping', color: '#FF33A8', icon: 'shopping-bag' },
    { name: 'Utilities', color: '#33FFF5', icon: 'bolt' },
    { name: 'Healthcare', color: '#FF3333', icon: 'heart' },
    { name: 'Travel', color: '#33FFAA', icon: 'plane' },
    { name: 'Education', color: '#3357FF', icon: 'book' },
    { name: 'Other', color: '#AAAAAA', icon: 'ellipsis-h' },
  ];

  for (const category of defaultCategories) {
    await prisma.category.create({
      data: {
        ...category,
        isDefault: true,
      },
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD || 'Password@123';

  if (!email) {
    console.log('No SEED_EMAIL provided. Skipping demo user seed.');
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Seed user already exists.');
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      email,
      passwordHash: await bcrypt.hash(password, 12),
      workspaces: {
        create: { name: "Demo workspace" }
      }
    },
    include: { workspaces: true }
  });

  const workspace = user.workspaces[0];
  const people = ['Me', 'Vedant', 'Sachin'];
  for (const name of people) {
    await prisma.person.create({ data: { workspaceId: workspace.id, name, isDefault: true } });
  }

  console.log(`Seeded demo user ${email} with password ${password}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

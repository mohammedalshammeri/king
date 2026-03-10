import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for active showroom accounts...');

  const activeShowrooms = await prisma.user.findMany({
    where: {
      role: 'USER_SHOWROOM',
      isActive: true,
    },
    include: {
      showroomProfile: true,
    },
  });

  console.log(`Found ${activeShowrooms.length} active showroom accounts.`);

  for (const user of activeShowrooms) {
    console.log(`- Fixing user: ${user.email} (${user.showroomProfile?.showroomName})`);

    await prisma.user.update({
      where: { id: user.id },
      data: { isActive: false },
    });

    console.log(`  ✅ Set isActive = false`);
  }

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

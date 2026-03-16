const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'apple.reviewer@kotm.app' },
    select: { email: true, role: true, isActive: true }
  });

  if (!user) {
    console.log('❌ User not found - apple.reviewer@kotm.app does not exist in DB');
    return;
  }

  console.log('✅ User found:', JSON.stringify(user));

  // Reset password
  const hash = await bcrypt.hash('Reviewer123!', 12);
  await prisma.user.update({
    where: { email: 'apple.reviewer@kotm.app' },
    data: { passwordHash: hash }
  });
  console.log('✅ Password reset to: Reviewer123!');
}

main().catch(console.error).finally(() => prisma.$disconnect());

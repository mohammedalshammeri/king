// Quick script to check database users count
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  console.log('\n='.repeat(60));
  console.log('DATABASE USERS CHECK');
  console.log('='.repeat(60));
  console.log('');
  
  try {
    // Count all users
    const totalUsers = await prisma.user.count();
    console.log('Total users in database:', totalUsers);
    
    // Count by role
    const individual = await prisma.user.count({ 
      where: { role: 'USER_INDIVIDUAL' } 
    });
    const showroom = await prisma.user.count({ 
      where: { role: 'USER_SHOWROOM' } 
    });
    const admin = await prisma.user.count({ 
      where: { role: 'ADMIN' } 
    });
    const superAdmin = await prisma.user.count({ 
      where: { role: 'SUPER_ADMIN' } 
    });
    
    console.log('');
    console.log('By role:');
    console.log('  USER_INDIVIDUAL:', individual);
    console.log('  USER_SHOWROOM:', showroom);
    console.log('  ADMIN:', admin);
    console.log('  SUPER_ADMIN:', superAdmin);
    
    // Get sample users
    console.log('');
    console.log('Sample users (first 5):');
    const sampleUsers = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        isBanned: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    
    sampleUsers.forEach((user, idx) => {
      console.log(`\n  ${idx + 1}. ${user.email || 'No email'}`);
      console.log(`     Phone: ${user.phone || 'N/A'}`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Active: ${user.isActive}, Banned: ${user.isBanned}`);
      console.log(`     Created: ${user.createdAt.toISOString()}`);
    });
    
    console.log('');
    console.log('='.repeat(60));
    console.log('');
    
  } catch (error) {
    console.error('ERROR:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();

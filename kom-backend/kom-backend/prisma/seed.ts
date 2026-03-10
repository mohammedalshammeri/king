import { PrismaClient, UserRole, Currency, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Super Admin from environment variables
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'info@kotm.app';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'SecureAdminPassword123!';

  const existingSuperAdmin = await prisma.user.findUnique({
    where: { email: superAdminEmail },
  });

  if (!existingSuperAdmin) {
    const hashedPassword = await bcrypt.hash(superAdminPassword, 12);

    const superAdmin = await prisma.user.create({
      data: {
        email: superAdminEmail,
        passwordHash: hashedPassword,
        role: UserRole.SUPER_ADMIN,
        isActive: true,
        isBanned: false,
        adminPermission: {
          create: {
            canReviewListings: true,
            canManageUsers: true,
            canViewReports: true,
            canManageAdmins: true,
            canManageSettings: true,
          },
        },
      },
    });

    console.log(`✅ Super Admin created: ${superAdmin.email}`);
  } else {
    console.log(`ℹ️ Super Admin already exists: ${superAdminEmail}`);
  }

  // Create System Settings
  const settings = [
    { key: 'REQUIRE_PAYMENT_FOR_CAR_LISTING', value: 'true', type: 'boolean' },
    { key: 'LISTING_FEE_BHD', value: '3', type: 'number' },
    { key: 'MAX_IMAGES_PER_LISTING', value: '15', type: 'number' },
    { key: 'MAX_VIDEOS_PER_LISTING', value: '2', type: 'number' },
    { key: 'MAX_IMAGE_SIZE_MB', value: '10', type: 'number' },
    { key: 'MAX_VIDEO_SIZE_MB', value: '100', type: 'number' },
    { key: 'MIN_IMAGES_FOR_CAR', value: '3', type: 'number' },
    { key: 'PRESIGN_UPLOAD_EXPIRATION_SECONDS', value: '3600', type: 'number' },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value, type: setting.type },
      create: setting,
    });
  }

  console.log('✅ System settings created/updated');

  // Optional: Create test users for development
  if (process.env.NODE_ENV === 'development') {
    // Create test individual user
    const testIndividualEmail = 'individual@test.com';
    const existingIndividual = await prisma.user.findUnique({
      where: { email: testIndividualEmail },
    });

    if (!existingIndividual) {
      const hashedPassword = await bcrypt.hash('Test123!', 12);
      await prisma.user.create({
        data: {
          email: testIndividualEmail,
          phone: '+97339001001',
          passwordHash: hashedPassword,
          role: UserRole.USER_INDIVIDUAL,
          isActive: true,
          individualProfile: {
            create: {
              fullName: 'Test Individual User',
              governorate: 'Capital',
              city: 'Manama',
            },
          },
        },
      });
      console.log(`✅ Test individual user created: ${testIndividualEmail}`);
    }

    // Create test showroom user
    const testShowroomEmail = 'showroom@test.com';
    const existingShowroom = await prisma.user.findUnique({
      where: { email: testShowroomEmail },
    });

    if (!existingShowroom) {
      const hashedPassword = await bcrypt.hash('Test123!', 12);
      await prisma.user.create({
        data: {
          email: testShowroomEmail,
          phone: '+97339002002',
          passwordHash: hashedPassword,
          role: UserRole.USER_SHOWROOM,
          isActive: true,
          showroomProfile: {
            create: {
              showroomName: 'Test Motors',
              crNumber: 'CR123456',
              governorate: 'Capital',
              city: 'Manama',
              address: 'Exhibition Road',
              contactPhones: {
                create: [
                  { phone: '+97317001001', label: 'Main', isPrimary: true },
                  { phone: '+97366001001', label: 'WhatsApp', isPrimary: false },
                ],
              },
            },
          },
        },
      });
      console.log(`✅ Test showroom user created: ${testShowroomEmail}`);
    }

    // Create test admin
    const testAdminEmail = 'admin@test.com';
    const existingAdmin = await prisma.user.findUnique({
      where: { email: testAdminEmail },
    });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('Test123!', 12);
      await prisma.user.create({
        data: {
          email: testAdminEmail,
          passwordHash: hashedPassword,
          role: UserRole.ADMIN,
          isActive: true,
          adminPermission: {
            create: {
              canReviewListings: true,
              canManageUsers: false,
              canViewReports: true,
              canManageAdmins: false,
              canManageSettings: false,
            },
          },
        },
      });
      console.log(`✅ Test admin user created: ${testAdminEmail}`);
    }
  }

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

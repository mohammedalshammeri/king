jest.mock('jose', () => ({
  createRemoteJWKSet: jest.fn(() => 'mock-jwks'),
  jwtVerify: jest.fn(),
}));

import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { SocialProvider } from './dto';

describe('AuthService', () => {
  const createService = () => {
    const prisma = {
      refreshToken: {
        findFirst: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        deleteMany: jest.fn(),
      },
    } as any;

    const jwtService = {
      verify: jest.fn(),
      signAsync: jest.fn(),
    } as any;

    const configService = {
      get: jest.fn((key: string) => {
        const values: Record<string, string | string[]> = {
          'jwt.refreshSecret': 'refresh-secret',
          'jwt.accessSecret': 'access-secret',
          'jwt.accessExpiration': '15m',
          'jwt.refreshExpiration': '7d',
          'auth.googleClientIds': ['google-client-id'],
          'auth.appleAudience': 'apple-client-id',
        };
        return values[key];
      }),
    } as any;

    const service = new AuthService(
      prisma,
      jwtService,
      configService,
      { notifyAdmins: jest.fn() } as any,
      { sendPasswordReset: jest.fn() } as any,
      { assignCodeToNewUser: jest.fn() } as any,
    );

    return { service, prisma, jwtService };
  };

  it('refreshes a valid token, revokes the old one, and stores the new one', async () => {
    const { service, prisma, jwtService } = createService();

    jwtService.verify.mockReturnValue({ sub: 'user-1' });
    prisma.refreshToken.findFirst.mockResolvedValue({
      id: 'rt-1',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        phone: '12345678',
        role: UserRole.USER_INDIVIDUAL,
        isBanned: false,
        isActive: true,
      },
    });
    jwtService.signAsync
      .mockResolvedValueOnce('new-access-token')
      .mockResolvedValueOnce('new-refresh-token');

    const result = await service.refreshToken({ refreshToken: 'valid-token' });

    expect(prisma.refreshToken.update).toHaveBeenCalledWith({
      where: { id: 'rt-1' },
      data: { isRevoked: true },
    });
    expect(prisma.refreshToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          token: 'new-refresh-token',
        }),
      }),
    );
    expect(result.accessToken).toBe('new-access-token');
    expect(result.refreshToken).toBe('new-refresh-token');
  });

  it('rejects refresh for inactive users', async () => {
    const { service, prisma, jwtService } = createService();

    jwtService.verify.mockReturnValue({ sub: 'user-1' });
    prisma.refreshToken.findFirst.mockResolvedValue({
      id: 'rt-1',
      user: {
        id: 'user-1',
        email: 'user@example.com',
        phone: null,
        role: UserRole.USER_INDIVIDUAL,
        isBanned: false,
        isActive: false,
      },
    });

    await expect(service.refreshToken({ refreshToken: 'valid-token' })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('rejects invalid refresh token lookups', async () => {
    const { service, prisma, jwtService } = createService();

    jwtService.verify.mockReturnValue({ sub: 'user-1' });
    prisma.refreshToken.findFirst.mockResolvedValue(null);

    await expect(service.refreshToken({ refreshToken: 'missing-token' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('maps invalid Google social tokens to UnauthorizedException', async () => {
    const { service } = createService();

    const verifyIdToken = jest.fn().mockRejectedValue(new Error('Token used too late'));
    (service as any).googleClient = { verifyIdToken };

    await expect(
      service.socialAuth({
        provider: SocialProvider.GOOGLE,
        idToken: 'invalid-token',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(verifyIdToken).toHaveBeenCalledWith({
      idToken: 'invalid-token',
      audience: ['google-client-id'],
    });
  });
});
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  isBanned: boolean;

  @ApiPropertyOptional()
  lastLoginAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  individualProfile?: {
    id: string;
    fullName: string;
    governorate?: string | null;
    city?: string | null;
  } | null;

  @ApiPropertyOptional()
  showroomProfile?: {
    id: string;
    showroomName: string;
    crNumber?: string | null;
    governorate?: string | null;
    city?: string | null;
    address?: string | null;
    logoUrl?: string | null;
    contactPhones?: { phone: string; label?: string | null; isPrimary: boolean }[];
  } | null;
}

export class AuthUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiPropertyOptional()
  phone?: string | null;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiPropertyOptional()
  luckCode?: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: AuthUserDto })
  user: AuthUserDto;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiPropertyOptional()
  message?: string;
}

export interface TokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

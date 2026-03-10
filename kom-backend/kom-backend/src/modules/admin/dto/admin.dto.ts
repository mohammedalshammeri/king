import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  MinLength,
  MaxLength,
  Matches,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '@prisma/client';
import { PaginationDto } from '../../../common/dto';

export class AdminPermissionsDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  canReviewListings?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  canManageUsers?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  canViewReports?: boolean;
}

export class CreateAdminDto {
  @ApiProperty({ example: 'info@kotm.app' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;

  @ApiPropertyOptional({ type: AdminPermissionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AdminPermissionsDto)
  permissions?: AdminPermissionsDto;
}

export class UpdateAdminPermissionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canReviewListings?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canManageUsers?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  canViewReports?: boolean;
}

export class AdminQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  isActive?: string;
}

export class UserQueryDto extends PaginationDto {
  @ApiPropertyOptional({ enum: [UserRole.USER_INDIVIDUAL, UserRole.USER_SHOWROOM] })
  @IsOptional()
  @IsEnum([UserRole.USER_INDIVIDUAL, UserRole.USER_SHOWROOM])
  role?: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  isBanned?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class BanUserDto {
  @ApiProperty({ example: 'Violation of terms of service' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(500)
  reason: string;
}

export class UpdateSystemSettingDto {
  @ApiProperty({ example: 'LISTING_FEE_BHD' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: '5' })
  @IsNotEmpty()
  value: string | number | boolean;

  @ApiPropertyOptional({ enum: ['string', 'number', 'boolean', 'json'] })
  @IsOptional()
  @IsEnum(['string', 'number', 'boolean', 'json'])
  type?: string;
}

export class AuditLogQueryDto extends PaginationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  action?: string;
}

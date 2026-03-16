import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  Matches,
} from 'class-validator';

export enum UserType {
  INDIVIDUAL = 'INDIVIDUAL',
  SHOWROOM = 'SHOWROOM',
}

export enum MerchantType {
  CAR_SHOWROOM = 'CAR_SHOWROOM',
  SPARE_PARTS = 'SPARE_PARTS',
  PLATES = 'PLATES',
  MOTORCYCLES = 'MOTORCYCLES',
  GARAGE = 'GARAGE',
  OTHER = 'OTHER',
}

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+97339001001' })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;

  @ApiProperty({ enum: UserType, example: UserType.INDIVIDUAL })
  @IsEnum(UserType)
  userType: UserType;

  @ApiPropertyOptional({ example: 'Ahmed Mohammed', description: 'Required for INDIVIDUAL' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({ example: 'ABC Motors', description: 'Required for SHOWROOM' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  showroomName?: string;

  @ApiPropertyOptional({ enum: MerchantType, example: MerchantType.CAR_SHOWROOM })
  @IsEnum(MerchantType)
  @IsOptional()
  merchantType?: MerchantType;

  @ApiPropertyOptional({
    example: 'CR123456',
    description: 'Commercial Registration Number for SHOWROOM',
  })
  @IsOptional()
  @IsString()
  crNumber?: string;

  @ApiPropertyOptional({ example: 'Capital' })
  @IsOptional()
  @IsString()
  governorate?: string;

  @ApiPropertyOptional({ example: 'Manama' })
  @IsOptional()
  @IsString()
  city?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RestoreAccountDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'SecurePassword123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutDto {
  @ApiPropertyOptional({
    description: 'Refresh token to revoke (optional, if not provided all tokens will be revoked)',
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'abc123def456' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123!' })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  newPassword: string;
}

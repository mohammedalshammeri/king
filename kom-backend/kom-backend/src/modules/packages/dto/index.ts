import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsInt,
  IsPositive,
  Min,
  Max,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

// ─── Merchant Subscription Packages ──────────────────────────────────────────

export class CreatePackageDto {
  @ApiProperty({ example: 'الباقة الأساسية' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'حتى 10 إعلانات نشطة شهرياً' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 9.9, description: 'سعر الاشتراك لمدة شهر واحد' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  priceMonthly: number;

  @ApiPropertyOptional({ example: 25.9, description: 'سعر 3 أشهر (اختياري)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price3Months?: number;

  @ApiPropertyOptional({ example: 49.9, description: 'سعر 6 أشهر (اختياري)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price6Months?: number;

  @ApiPropertyOptional({ example: 89.9, description: 'سعر سنة كاملة (اختياري)' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price12Months?: number;

  @ApiPropertyOptional({ example: 'وفّر 25%', description: 'ملاحظة الخصم تظهر في الواجهة' })
  @IsOptional()
  @IsString()
  discountNote?: string;

  @ApiProperty({ example: 10, description: 'الحد الأقصى لعدد الإعلانات النشطة' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  maxListings: number;

  @ApiPropertyOptional({ example: 3, description: 'الحد الأقصى لعدد القصص المسموح بها في الدورة' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxStories?: number;

  @ApiPropertyOptional({ example: 30, description: 'المدة الأساسية بالأيام (30 = شهر واحد)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  durationDays?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdatePackageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  priceMonthly?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price3Months?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price6Months?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price12Months?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  discountNote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  maxListings?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxStories?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(365)
  @Type(() => Number)
  durationDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class SubscribeDto {
  @ApiProperty({ example: 'package-uuid-here' })
  @IsString()
  @IsNotEmpty()
  packageId: string;

  @ApiProperty({
    example: '1',
    description: 'مدة الاشتراك: 1 شهر، 3 أشهر، 6 أشهر، أو 12 شهراً',
    enum: ['1', '3', '6', '12'],
  })
  @IsString()
  @IsIn(['1', '3', '6', '12'])
  durationChoice: '1' | '3' | '6' | '12';
}

// ─── Individual Listing Packages ─────────────────────────────────────────────

export class CreateIndividualPackageDto {
  @ApiProperty({ example: '5 إعلانات' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'انشر 5 إعلانات للأفراد' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 5, description: 'عدد الإعلانات المضمنة في الباقة' })
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  listingCount: number;

  @ApiPropertyOptional({ example: 2, description: 'الحد الأقصى لعدد القصص المسموح بها بهذه الباقة' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxStories?: number;

  @ApiProperty({ example: 4.9, description: 'سعر الباقة' })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateIndividualPackageDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  listingCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  maxStories?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  sortOrder?: number;
}

export class PurchaseIndividualPackageDto {
  @ApiProperty({ example: 'individual-package-uuid-here' })
  @IsString()
  @IsNotEmpty()
  packageId: string;
}

import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateFeaturedPackageDto {
  @ApiProperty({ example: 'تمييز 7 أيام' })
  @IsString()
  nameAr: string;

  @ApiProperty({ example: 5.0 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiProperty({ example: 7 })
  @IsInt()
  @Type(() => Number)
  @Min(1)
  durationDays: number;

  @ApiProperty({ required: false, example: 0 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}

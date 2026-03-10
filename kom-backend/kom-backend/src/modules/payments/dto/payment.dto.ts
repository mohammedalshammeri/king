import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty({ example: 'uuid-of-listing' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  listingId: string;

  @ApiPropertyOptional({ example: 'benefit' })
  @IsOptional()
  @IsString()
  provider?: string;
}

export class InitiateSubscriptionPaymentDto {
  @ApiProperty({ example: 'uuid-of-package' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  packageId: string;

  @ApiPropertyOptional({ example: '1', description: 'Duration choice: 1, 3, 6, or 12 months' })
  @IsOptional()
  @IsString()
  @IsIn(['1', '3', '6', '12'])
  durationChoice?: '1' | '3' | '6' | '12';
}

export class InitiateIndividualPackagePaymentDto {
  @ApiProperty({ example: 'uuid-of-individual-package' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  packageId: string;
}

export class InitiateFeaturedPaymentDto {
  @ApiProperty({ example: 'uuid-of-listing' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  listingId: string;

  @ApiProperty({ example: 'uuid-of-featured-package' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  packageId: string;
}

export class SubmitBenefitProofDto {
  @ApiProperty({ example: 'https://res.cloudinary.com/...' })
  @IsString()
  @IsNotEmpty()
  proofImageUrl: string;
}

export class ReviewPaymentDto {
  @ApiProperty({ enum: ['APPROVE', 'REJECT'] })
  @IsEnum(['APPROVE', 'REJECT'])
  action: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({ example: 'Transfer confirmed' })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ManualPaymentDto {
  @ApiPropertyOptional({ example: 'REF123456' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'Cash payment received' })
  @IsOptional()
  @IsString()
  note?: string;

  // Set by controller
  adminId?: string;
}

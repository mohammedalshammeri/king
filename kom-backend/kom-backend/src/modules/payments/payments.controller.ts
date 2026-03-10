import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles, Public } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import {
  InitiatePaymentDto,
  InitiateSubscriptionPaymentDto,
  InitiateIndividualPackagePaymentDto,
  InitiateFeaturedPaymentDto,
  SubmitBenefitProofDto,
  ReviewPaymentDto,
  ManualPaymentDto,
} from './dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── Public ─────────────────────────────────────────────────────────────────

  @Get('benefit-iban')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get Benefit bank transfer IBAN' })
  getBenefitIban() {
    return this.paymentsService.getBenefitIban();
  }

  // ─── User ────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Post('listing-fee/initiate')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initiate listing fee payment' })
  initiateListingFeePayment(@CurrentUser('id') userId: string, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiateListingFeePayment(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('upload-proof-image')
  @UseInterceptors(
    FileInterceptor('file', { storage: memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Upload payment proof image and get URL' })
  async uploadProofImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    const url = await this.paymentsService.uploadProofImage(file.buffer, file.mimetype);
    return { url };
  }

  @UseGuards(JwtAuthGuard)
  @Post('featured-listing/initiate')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initiate featured listing payment via Benefit transfer' })
  initiateFeaturedListingPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: InitiateFeaturedPaymentDto,
  ) {
    return this.paymentsService.initiateFeaturedListingPayment(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscription/initiate')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initiate subscription payment via Benefit transfer' })
  initiateSubscriptionPayment(
    @CurrentUser('id') userId: string,
    @Body() dto: InitiateSubscriptionPaymentDto,
  ) {
    return this.paymentsService.initiateSubscriptionPayment(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('individual-package/initiate')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Initiate individual listing package payment via Benefit transfer' })
  initiateIndividualPackagePayment(
    @CurrentUser('id') userId: string,
    @Body() dto: InitiateIndividualPackagePaymentDto,
  ) {
    return this.paymentsService.initiateIndividualPackagePayment(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit-proof')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit Benefit transfer proof image URL' })
  @ApiResponse({ status: 200, description: 'Proof submitted, awaiting admin review' })
  submitProof(
    @CurrentUser('id') userId: string,
    @Param('id') transactionId: string,
    @Body() dto: SubmitBenefitProofDto,
  ) {
    return this.paymentsService.submitProof(userId, transactionId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-transactions')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user payment history' })
  getMyTransactions(@CurrentUser('id') userId: string) {
    return this.paymentsService.getMyTransactions(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('transaction/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get transaction details' })
  getTransaction(@Param('id') id: string) {
    return this.paymentsService.getTransaction(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('listing/:listingId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get transactions for a listing' })
  getListingTransactions(@CurrentUser('id') userId: string, @Param('listingId') listingId: string) {
    return this.paymentsService.getListingTransactions(userId, listingId);
  }

  // ─── Admin ────────────────────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/pending-review')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all payments pending admin review' })
  getPendingProofPayments() {
    return this.paymentsService.getPendingProofPayments();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all payment transactions (admin)' })
  getAllPaymentsAdmin(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.paymentsService.getAllPaymentsAdmin(page, limit);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('admin/:id/review')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Approve or reject a payment proof (admin)' })
  reviewPayment(
    @CurrentUser('id') adminId: string,
    @Param('id') transactionId: string,
    @Body() dto: ReviewPaymentDto,
  ) {
    return this.paymentsService.reviewPayment(adminId, transactionId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Post('transaction/:id/mark-paid')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Manually mark payment as paid (Super Admin only)' })
  markPaymentAsPaid(
    @CurrentUser('id') adminId: string,
    @Param('id') transactionId: string,
    @Body() dto: ManualPaymentDto,
  ) {
    return this.paymentsService.markPaymentAsPaid(transactionId, { ...dto, adminId });
  }

  @Public()
  @Post('webhook/:provider')
  @ApiOperation({ summary: 'Payment provider webhook (public)' })
  handleWebhook(@Param('provider') provider: string, @Body() payload: Record<string, unknown>) {
    return this.paymentsService.handlePaymentWebhook(provider, payload);
  }
}

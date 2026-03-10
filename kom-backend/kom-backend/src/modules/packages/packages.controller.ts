import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PackagesService } from './packages.service';
import {
  CreatePackageDto,
  UpdatePackageDto,
  SubscribeDto,
  CreateIndividualPackageDto,
  UpdateIndividualPackageDto,
  PurchaseIndividualPackageDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('packages')
@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  private getUserId(req: ExpressRequest & { user: { id: string } }) {
    return req.user.id;
  }

  // ─── Public ────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'باقات الاشتراك للتجار (عامة)' })
  getActivePackages() {
    return this.packagesService.getActivePackages();
  }

  @Get('individual')
  @ApiOperation({ summary: 'باقات الإعلانات للأفراد (عامة)' })
  getActiveIndividualPackages() {
    return this.packagesService.getActiveIndividualPackages();
  }

  // ─── Merchant (USER_SHOWROOM) ───────────────────────────────────────────────

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'اشتراكي الحالي (تاجر)' })
  getMySubscription(@Request() req: ExpressRequest & { user: { id: string } }) {
    return this.packagesService.getMySubscription(this.getUserId(req));
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'الاشتراك في باقة — يدعم 1/3/6/12 شهراً (تجار فقط)' })
  subscribe(@Request() req: ExpressRequest & { user: { id: string } }, @Body() dto: SubscribeDto) {
    return this.packagesService.subscribe(this.getUserId(req), dto);
  }

  // ─── Individual (USER_INDIVIDUAL) ─────────────────────────────────────────

  @Get('my-credits')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'رصيد إعلاناتي المتبقي (أفراد)' })
  getMyIndividualPurchases(@Request() req: ExpressRequest & { user: { id: string } }) {
    return this.packagesService.getMyIndividualPurchases(this.getUserId(req));
  }

  @Post('individual/purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'شراء باقة إعلانات فردية' })
  purchaseIndividualPackage(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() dto: PurchaseIndividualPackageDto,
  ) {
    return this.packagesService.purchaseIndividualPackage(this.getUserId(req), dto);
  }

  // ─── Admin — Merchant packages ─────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] جميع باقات التجار' })
  getAllPackages() {
    return this.packagesService.getAllPackages();
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] إنشاء باقة تاجر جديدة' })
  createPackage(@Body() dto: CreatePackageDto) {
    return this.packagesService.createPackage(dto);
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] تعديل باقة تاجر' })
  updatePackage(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packagesService.updatePackage(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] حذف/تعطيل باقة تاجر' })
  deletePackage(@Param('id') id: string) {
    return this.packagesService.deletePackage(id);
  }

  // ─── Admin — Individual packages ───────────────────────────────────────────

  @Get('admin/individual/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] جميع باقات الأفراد' })
  getAllIndividualPackages() {
    return this.packagesService.getAllIndividualPackages();
  }

  @Post('admin/individual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] إنشاء باقة فردية جديدة (مثل: 5 إعلانات بـ 4.9 BD)' })
  createIndividualPackage(@Body() dto: CreateIndividualPackageDto) {
    return this.packagesService.createIndividualPackage(dto);
  }

  @Patch('admin/individual/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] تعديل باقة فردية' })
  updateIndividualPackage(@Param('id') id: string, @Body() dto: UpdateIndividualPackageDto) {
    return this.packagesService.updateIndividualPackage(id, dto);
  }

  @Delete('admin/individual/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] حذف/تعطيل باقة فردية' })
  deleteIndividualPackage(@Param('id') id: string) {
    return this.packagesService.deleteIndividualPackage(id);
  }
}

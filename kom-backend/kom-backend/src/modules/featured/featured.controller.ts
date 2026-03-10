import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FeaturedService } from './featured.service';
import { CreateFeaturedPackageDto } from './dto/create-featured-package.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Featured Packages')
@Controller('featured-packages')
export class FeaturedController {
  constructor(private readonly featuredService: FeaturedService) {}

  // ── Public: list active packages ───────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get active featured packages (public)' })
  async findAll() {
    return this.featuredService.findAllPackages(true);
  }

  // ── Admin: manage packages ──────────────────────────────────────────────────

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all featured packages (admin)' })
  async findAllAdmin() {
    return this.featuredService.findAllPackages(false);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a featured package (admin)' })
  async create(@Body() dto: CreateFeaturedPackageDto) {
    return this.featuredService.createPackage(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update a featured package (admin)' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateFeaturedPackageDto> & { isActive?: boolean },
  ) {
    return this.featuredService.updatePackage(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete a featured package (admin)' })
  async remove(@Param('id') id: string) {
    return this.featuredService.deletePackage(id);
  }

  // ── Admin: feature/unfeature a listing ─────────────────────────────────────

  @Post('listings/:listingId/feature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark a listing as featured (admin)' })
  async featureListing(
    @Param('listingId') listingId: string,
    @Body('packageId') packageId: string,
  ) {
    return this.featuredService.featureListing(listingId, packageId);
  }

  @Post('listings/:listingId/unfeature')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove featured status from a listing (admin)' })
  async unfeatureListing(@Param('listingId') listingId: string) {
    return this.featuredService.unfeatureListing(listingId);
  }
}

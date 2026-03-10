import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ListingsService } from './listings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../../common/decorators';
import {
  CreateListingDto,
  UpdateListingDto,
  ListingQueryDto,
  CarDetailsDto,
  PlateDetailsDto,
  PartDetailsDto,
  CreateMotorcycleDetailsDto,
} from './dto';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  // Public endpoints
  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all approved listings (public)' })
  @ApiResponse({ status: 200, description: 'List of approved listings' })
  async getPublicListings(@Query() query: ListingQueryDto) {
    return this.listingsService.getPublicListings(query);
  }

  // Favorites endpoints (MUST come before /:id to avoid route conflicts!)
  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my favorite listings' })
  @ApiResponse({ status: 200, description: 'List of favorite listings' })
  async getMyFavorites(@CurrentUser('id') userId: string, @Query() query: ListingQueryDto) {
    return this.listingsService.getMyFavorites(userId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Public()
  @Get(':id/favorite-status')
  @ApiOperation({ summary: 'Get favorite status for a listing' })
  @ApiResponse({ status: 200, description: 'Favorite status' })
  @ApiBearerAuth('JWT-auth')
  async getFavoriteStatus(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.listingsService.getFavoriteStatus(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add listing to favorites' })
  @ApiResponse({ status: 201, description: 'Listing added to favorites' })
  async addToFavorites(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.listingsService.addToFavorites(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id/favorite')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove listing from favorites' })
  @ApiResponse({ status: 200, description: 'Listing removed from favorites' })
  async removeFromFavorites(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.listingsService.removeFromFavorites(userId, id);
  }

  // Owner endpoints
  @UseGuards(JwtAuthGuard)
  @Get('my/all')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my listings' })
  @ApiResponse({ status: 200, description: 'My listings' })
  async getMyListings(@CurrentUser('id') userId: string, @Query() query: ListingQueryDto) {
    return this.listingsService.getMyListings(userId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my listing by ID' })
  @ApiResponse({ status: 200, description: 'My listing details' })
  async getMyListingById(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.listingsService.getMyListingById(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new listing' })
  @ApiResponse({ status: 201, description: 'Listing created' })
  async createListing(@CurrentUser('id') userId: string, @Body() dto: CreateListingDto) {
    return this.listingsService.createListing(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update listing' })
  @ApiResponse({ status: 200, description: 'Listing updated' })
  async updateListing(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateListingDto,
  ) {
    return this.listingsService.updateListing(userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/details/car')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add/Update car details' })
  @ApiResponse({ status: 200, description: 'Car details saved' })
  async upsertCarDetails(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CarDetailsDto,
  ) {
    return this.listingsService.upsertCarDetails(userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/details/motorcycle')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add/Update motorcycle details' })
  @ApiResponse({ status: 200, description: 'Motorcycle details saved' })
  async upsertMotorcycleDetails(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CreateMotorcycleDetailsDto,
  ) {
    return this.listingsService.upsertMotorcycleDetails(userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/details/plate')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add/Update plate details' })
  @ApiResponse({ status: 200, description: 'Plate details saved' })
  async upsertPlateDetails(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: PlateDetailsDto,
  ) {
    return this.listingsService.upsertPlateDetails(userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/details/part')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add/Update part details' })
  @ApiResponse({ status: 200, description: 'Part details saved' })
  async upsertPartDetails(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: PartDetailsDto,
  ) {
    return this.listingsService.upsertPartDetails(userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit listing for review' })
  @ApiResponse({ status: 200, description: 'Listing submitted for review' })
  @ApiResponse({ status: 400, description: 'Validation errors' })
  async submitForReview(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.listingsService.submitForReview(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/save-draft')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Save listing as draft' })
  @ApiResponse({ status: 200, description: 'Listing saved as draft' })
  async saveAsDraft(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.listingsService.saveAsDraft(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete (archive) listing' })
  @ApiResponse({ status: 200, description: 'Listing archived' })
  async deleteListing(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.listingsService.deleteListing(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/mark-sold')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Mark listing as sold' })
  @ApiResponse({ status: 200, description: 'Listing marked as sold' })
  async markAsSold(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.listingsService.markAsSold(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/sold-check-response')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Respond to a sold-check notification (is it sold or still active?)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { isSold: { type: 'boolean', example: true } },
      required: ['isSold'],
    },
  })
  @ApiResponse({ status: 200, description: 'Response recorded. Listing updated accordingly.' })
  async respondToSoldCheck(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body('isSold') isSold: boolean,
  ) {
    return this.listingsService.respondToSoldCheck(userId, id, isSold);
  }

  // Generic :id route MUST be last to avoid catching specific routes like /favorites
  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get listing by ID (public)' })
  @ApiResponse({ status: 200, description: 'Listing details' })
  @ApiResponse({ status: 404, description: 'Listing not found' })
  async getPublicListingById(@Param('id') id: string) {
    return this.listingsService.getPublicListingById(id);
  }
}

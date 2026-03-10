import { Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LuckService } from './luck.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';
import { UserRole } from '@prisma/client';

@ApiTags('Luck')
@Controller()
export class LuckController {
  constructor(private readonly luckService: LuckService) {}

  /** Public: get current luck feature status + winner */
  @Get('luck/status')
  @ApiOperation({ summary: 'Get luck feature status and winner' })
  getStatus() {
    return this.luckService.getStatus();
  }

  /** Authenticated: get my own code */
  @Get('luck/my-code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get my luck code' })
  getMyEntry(@Request() req: any) {
    return this.luckService.getMyEntry(req.user.userId);
  }

  /** Admin: toggle feature on/off */
  @Post('admin/luck/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle luck feature on/off' })
  toggle() {
    return this.luckService.toggle();
  }

  /** Admin: list all luck entries */
  @Get('admin/luck/entries')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all luck entries' })
  getEntries() {
    return this.luckService.getEntries();
  }

  /** Admin: draw the winner */
  @Post('admin/luck/draw')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Draw a random winner' })
  drawWinner() {
    return this.luckService.drawWinner();
  }
}

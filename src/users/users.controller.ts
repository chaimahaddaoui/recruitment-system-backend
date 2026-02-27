import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('users')
export class UsersController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin')
  getAdminProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard) // Ajouter le guard ici aussi
  @Get('me')
  getProfile(@Request() req) {
    return req.user;
  }
}
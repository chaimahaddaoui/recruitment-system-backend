import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Route accessible à tous les utilisateurs authentifiés
  @Get('me')
  getMyProfile(@CurrentUser() user) {
    return {
      message: 'Your profile',
      user,
    };
  }

  // Route accessible uniquement aux ADMIN et HR_MANAGER
  @Roles(Role.ADMIN, Role.HR_MANAGER)
  @Get('all')
  async getAllUsers() {
    const users = await this.usersService.findAll();
    return {
      message: 'List of all users',
      users,
    };
  }

  // Route accessible uniquement aux ADMIN
  @Roles(Role.ADMIN)
  @Get('admin')
  getAdminData(@CurrentUser() user) {
    return {
      message: 'Admin data',
      user,
    };
  }
}
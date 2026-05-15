import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
  Patch,
  Req,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';


/* @Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN) // ← Seulement l'ADMIN
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Créer un utilisateur (RECRUITER ou HR_MANAGER)
  @Post('users')
  create(@Body() createUserDto: CreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  // Lister tous les utilisateurs
  @Get('users')
  findAll() {
    return this.adminService.getAllUsers();
  }

  // Supprimer un utilisateur
  @Delete('users/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }
} */

  @Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * Obtenir tous les utilisateurs
   */
  @Get('users')
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  /**
   * Obtenir les statistiques
   */
  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  /**
   * Obtenir un utilisateur par ID
   */
  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(+id);
  }

  /**
   * Modifier un utilisateur
   */
  @Patch('users/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(+id, updateUserDto);
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  @Post('users/:id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() resetPasswordDto: ResetPasswordDto,
  ) {
    return this.adminService.resetUserPassword(+id, resetPasswordDto.newPassword);
  }

  /**
   * Supprimer un utilisateur
   */
  @Delete('users/:id')
  async deleteUser(
    @Param('id') id: string,
    @Req() request: Request & { user?: any },
  ) {
    const adminId = request.user?.userId || request.user?.sub;
    return this.adminService.deleteUser(+id, adminId);
  }
}
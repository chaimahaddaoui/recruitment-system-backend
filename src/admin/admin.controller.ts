import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';

import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { CreateUserDto } from './dto/create-user.dto';


@Controller('admin')
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
}
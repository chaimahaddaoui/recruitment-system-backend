import { Controller, Get, Post, Put, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('hr-manager')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.HR_MANAGER, Role.ADMIN) // HR_MANAGER ou ADMIN peuvent accéder
export class HrManagerController {
  
  @Get('dashboard')
  getDashboard(@CurrentUser() user) {
    return {
      message: 'Welcome to HR Manager Dashboard',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Get('statistics')
  getStatistics() {
    return {
      message: 'HR Statistics',
      stats: {
        totalCandidates: 150,
        totalRecruiters: 8,
        activeApplications: 45,
        pendingInterviews: 12,
      },
    };
  }

  @Get('users')
  getAllUsers(@CurrentUser() user) {
    return {
      message: 'List of all users',
      users: [], // TODO: Implement with UsersService
    };
  }

  @Post('users')
  createUser(@Body() body: any) {
    return {
      message: 'User created',
      user: body,
    };
  }

  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return {
      message: `User ${id} updated`,
      user: body,
    };
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return {
      message: `User ${id} deleted`,
    };
  }

  @Get('reports')
  generateReports() {
    return {
      message: 'HR Reports',
      reports: [], // TODO: Implement
    };
  }

  @Post('approve/:applicationId')
  approveApplication(@Param('applicationId') applicationId: string) {
    return {
      message: `Application ${applicationId} approved`,
    };
  }
}
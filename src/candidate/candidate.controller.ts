import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('candidate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.CANDIDATE)
export class CandidateController {
  
  @Get('dashboard')
  getDashboard(@CurrentUser() user) {
    return {
      message: 'Welcome to Candidate Dashboard',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Get('profile')
  getProfile(@CurrentUser() user) {
    return {
      message: 'Candidate Profile',
      user,
    };
  }

  @Post('apply/:jobId')
  applyToJob(@CurrentUser() user, @Param('jobId') jobId: string) {
    return {
      message: `Application submitted for job ${jobId}`,
      candidateId: user.id,
    };
  }

  @Get('applications')
  getMyApplications(@CurrentUser() user) {
    return {
      message: 'Your applications',
      candidateId: user.id,
      applications: [], // TODO: Implement
    };
  }
}
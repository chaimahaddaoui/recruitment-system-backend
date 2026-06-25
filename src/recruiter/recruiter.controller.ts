import { Controller, Get, Post, Put, Body, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('recruiter')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.RECRUITER)
export class RecruiterController {
  
  @Get('dashboard')
  getDashboard(@CurrentUser() user) {
    return {
      message: 'Welcome to Recruiter Dashboard',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  @Get('candidates')
  getAllCandidates(@CurrentUser() user) {
    return {
      message: 'List of all candidates',
      recruiterId: user.id,
      candidates: [], // TODO: Implement
    };
  }

  @Get('candidates/:id')
  getCandidateDetails(@Param('id') id: string) {
    return {
      message: `Details of candidate ${id}`,
      candidate: {}, 
    };
  }

  @Put('candidates/:id/status')
  updateCandidateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return {
      message: `Candidate ${id} status updated to ${body.status}`,
    };
  }

  @Post('schedule-interview/:candidateId')
  scheduleInterview(@Param('candidateId') candidateId: string, @Body() body: any) {
    return {
      message: `Interview scheduled for candidate ${candidateId}`,
      interview: body,
    };
  }
}
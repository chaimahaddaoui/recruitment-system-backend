import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { EvaluateInterviewDto } from './dto/evaluate-interview.dto';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  @Post()
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  create(
    @Body() dto: CreateInterviewDto,
    @Req() req: Request & { user?: any },
  ) {
    const userId = req.user?.userId || req.user?.sub;
    const role = req.user?.role;
    return this.interviewsService.create(dto, userId, role);
  }

  @Patch(':id/evaluate')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  evaluate(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EvaluateInterviewDto,
    @Req() req: Request & { user?: any },
  ) {
    const userId = req.user?.userId || req.user?.sub;
    return this.interviewsService.evaluate(id, dto, userId);
  }

  @Patch(':id/cancel')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user?: any },
  ) {
    const userId = req.user?.userId || req.user?.sub;
    return this.interviewsService.cancel(id, userId);
  }

  @Get('application/:applicationId')
  findByApplication(@Param('applicationId', ParseIntPipe) applicationId: number) {
    return this.interviewsService.findByApplication(applicationId);
  }

  @Get('my-interviews')
  findMy(@Req() req: Request & { user?: any }) {
    const userId = req.user?.userId || req.user?.sub;
    return this.interviewsService.findByInterviewer(userId);
  }
}
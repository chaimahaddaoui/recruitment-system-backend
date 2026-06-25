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
  Query,
} from '@nestjs/common';
import { InterviewsService } from './interviews.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { EvaluateInterviewDto } from './dto/evaluate-interview.dto';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InterviewsController {
  constructor(private readonly interviewsService: InterviewsService) {}

  // Créer un entretien (RECRUITER, HR_MANAGER, ADMIN)
  @Post()
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  create(@Req() request: any, @Body() createInterviewDto: CreateInterviewDto) {
    const userId = request.user?.userId || request.user?.sub;
    const role = request.user?.role;
    return this.interviewsService.create(userId, role, createInterviewDto);
  }

  // ✅ Nouveau : disponibilité du recruteur/RH connecté
  // Exemple : GET /interviews/availability?date=2026-02-06
  @Get('availability')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  getAvailability(@Req() request: any, @Query('date') date: string) {
    const userId = request.user?.userId || request.user?.sub;
    return this.interviewsService.getAvailability(userId, date);
  }

  // Évaluer un entretien
  @Patch(':id/evaluate')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  evaluate(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: any,
    @Body() evaluateDto: EvaluateInterviewDto,
  ) {
    const userId = request.user?.userId || request.user?.sub;
    const role = request.user?.role;
    return this.interviewsService.evaluate(id, userId, role, evaluateDto);
  }

  // Annuler un entretien
  @Patch(':id/cancel')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  cancel(@Param('id', ParseIntPipe) id: number, @Req() request: any) {
    const userId = request.user?.userId || request.user?.sub;
    return this.interviewsService.cancel(id, userId);
  }

  // Mes entretiens
  @Get('my-interviews')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  getMyInterviews(@Req() request: any) {
    const userId = request.user?.userId || request.user?.sub;
    return this.interviewsService.getMyInterviews(userId);
  }

  // Entretiens d'une candidature
  @Get('application/:id')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  getInterviewsByApplication(@Param('id', ParseIntPipe) id: number) {
    return this.interviewsService.getInterviewsByApplication(id);
  }
}
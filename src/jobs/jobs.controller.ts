import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';


/* 
@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // Créer une offre (RECRUITER, HR_MANAGER, ADMIN)
  @Post()
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  create(
    @CurrentUser() user: any,
    @Body() createJobDto: CreateJobDto,
  ) {
    return this.jobsService.create(user.id, createJobDto);
  }

  // Liste des offres ouvertes (tous rôles)
  @Get('open')
  findAllOpen() {
    return this.jobsService.findAllOpen();
  }

  // Liste de toutes les offres (selon le rôle)
  @Get()
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  findAll(@CurrentUser() user: any) {
    return this.jobsService.findAll(user.id, user.role);
  }

  // Détails d'une offre
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.findOne(id);
  }

  // Modifier une offre
  @Patch(':id')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
    @Body() updateJobDto: UpdateJobDto,
  ) {
    return this.jobsService.update(id, user.id, user.role, updateJobDto);
  }

  // Publier une offre
  @Patch(':id/publish')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  publish(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.jobsService.publish(id, user.id, user.role);
  }

  // Fermer une offre
  @Patch(':id/close')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  close(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.jobsService.close(id, user.id, user.role);
  }

  // Supprimer une offre
  @Delete(':id')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.jobsService.remove(id, user.id, user.role);
  }
} */

@Controller('jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  // Créer une offre
  @Post()
  @Roles(Role.RECRUITER, Role.HR_MANAGER)
  create(
    @Body() createJobDto: CreateJobDto,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;
    return this.jobsService.create(createJobDto, userId);
  }

  // Soumettre l'offre au RH (Recruteur)
  @Patch(':id/submit')
  @Roles(Role.RECRUITER)
  submitForValidation(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;
    return this.jobsService.submitForValidation(id, userId);
  }

  // Valider et publier (RH)
  @Patch(':id/validate')
  @Roles(Role.HR_MANAGER)
  validateAndPublish(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.validateAndPublish(id);
  }

  // Rejeter et renvoyer au recruteur (RH)
  @Patch(':id/reject')
  @Roles(Role.HR_MANAGER)
  rejectAndSendBack(
    @Param('id', ParseIntPipe) id: number,
    @Body('feedback') feedback: string,
  ) {
    return this.jobsService.rejectAndSendBack(id, feedback);
  }

  // Modifier une offre
  @Patch(':id')
  @Roles(Role.RECRUITER, Role.HR_MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;
    const role = request.user?.role;
    return this.jobsService.update(id, updateJobDto, userId, role);
  }

  // Fermer une offre (RH)
  @Patch(':id/close')
  @Roles(Role.HR_MANAGER)
  close(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.close(id);
  }

  // Supprimer une offre
  @Delete(':id')
  @Roles(Role.RECRUITER, Role.HR_MANAGER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;
    const role = request.user?.role;
    return this.jobsService.remove(id, userId, role);
  }

  // Voir les offres ouvertes (Candidats)
  @Get('open')
  findOpenJobs() {
    return this.jobsService.findAllOpen();
  }

  // Voir toutes les offres (selon rôle)
  @Get()
  @Roles(Role.RECRUITER, Role.HR_MANAGER)
  findAll(@Req() request: Request & { user?: any }) {
    const userId = request.user?.userId || request.user?.sub;
    const role = request.user?.role;
    return this.jobsService.findAll(userId, role);
  }

  // Voir une offre
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.findOne(id);
  }
}
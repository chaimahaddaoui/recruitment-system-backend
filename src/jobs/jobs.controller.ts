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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

/* 
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
  @Roles(Role.HR_MANAGER,)
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
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
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
 /*  @Patch(':id/validate')
  @Roles(Role.HR_MANAGER)
  validateAndPublish(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.validateAndPublish(id);
  } */
 // ✅ Modifier une offre
  @Patch(':id')
  @Roles(Role.RECRUITER, Role.HR_MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateJobDto: UpdateJobDto,
    @Req() request: any, // Utilise 'any' ici pour éviter les erreurs de type TS
  ) {
    // On récupère l'ID peu importe le nom de la clé (id, userId ou sub)
    const rawId = request.user?.id || request.user?.userId || request.user?.sub;
    
    // On force la conversion en nombre pour que la comparaison avec la DB soit juste
    const userId = Number(rawId); 
    const role = request.user?.role;

    return this.jobsService.update(id, updateJobDto, userId, role);
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

  // ✅ NOVO : Fermar uma oferta (RECRUTEUR & RH)
  @Patch(':id/close')
  @Roles( Role.HR_MANAGER)
  close(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;
    const role = request.user?.role;
    return this.jobsService.close(id, userId, role);
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
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  findAll(@Req() request: Request & { user?: any }) {
    const userId = request.user?.userId || request.user?.sub;
    const role = request.user?.role;
    return this.jobsService.findAll(userId, role);
  }

  // ✅ Voir une offre (accessible à tous)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.jobsService.findOne(id);
  }
}
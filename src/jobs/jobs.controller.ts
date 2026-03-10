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
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';


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
}
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { CurrentUser } from 'src/auth/current-user.decorator';


import { Role, ApplicationStatus } from '@prisma/client';
@Controller('applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // Postuler à une offre (CANDIDATE)
  @Post()
  @Roles(Role.CANDIDATE)
  @UseInterceptors(
    FileInterceptor('cv', {
      storage: diskStorage({
        destination: './uploads/cvs',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          const filename = `cv-${uniqueSuffix}${ext}`;
          callback(null, filename);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.originalname.match(/\.(pdf|doc|docx)$/)) {
          return callback(
            new BadRequestException('Seuls les fichiers PDF et DOCX sont acceptés'),
            false,
          );
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB max
      },
    }),
  )
 async create(
  @Req() request: Request & { user?: any },
  @Body() createApplicationDto: CreateApplicationDto,
  @UploadedFile() file: Express.Multer.File,
) {
  console.log('📝 Request user:', request.user);
  console.log('📝 Body:', createApplicationDto);
  console.log('📝 File:', file?.filename);

  if (!file) {
    throw new BadRequestException('Le CV est obligatoire');
  }

  // 🔥 CORRECTION ICI
  const userId = request.user?.id;

  if (!userId) {
    throw new UnauthorizedException('Utilisateur non authentifié');
  }

  const cvPath = `/uploads/cvs/${file.filename}`;

  return this.applicationsService.create(userId, {
    ...createApplicationDto,
    cvPath,
  });
}

  // Voir mes candidatures (CANDIDATE)
  @Get('my-applications')
  @Roles(Role.CANDIDATE)
  findMyApplications(@Req() request: Request & { user?: any }) {
    const userId = request.user?.id;
    return this.applicationsService.findAllByCandidate(userId);
  }

  // Voir les candidatures d'une offre (RECRUITER, HR_MANAGER, ADMIN)
  @Get('job/:jobId')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  findByJob(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.id;
    return this.applicationsService.findAllByJob(jobId, userId);
  }

  // Voir une candidature spécifique
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.id;
    const role = request.user?.role;
    return this.applicationsService.findOne(id, userId, role);
  }

  // Changer le statut d'une candidature (RECRUITER, HR_MANAGER, ADMIN)
  @Patch(':id/status')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ApplicationStatus,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.id;
    return this.applicationsService.updateStatus(id, status, userId);
  }

  // Supprimer une candidature (RECRUITER, HR_MANAGER, ADMIN)
  @Delete(':id')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.id;
    return this.applicationsService.delete(id, userId);
  }
}
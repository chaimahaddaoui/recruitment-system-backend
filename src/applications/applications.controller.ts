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
  Request,
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

  // ⭐ IMPORTANT: Routes spécifiques AVANT les routes paramétrées généralistes!

  // ✅ Route spécifique HR Manager - DOIT ÊTRE AVANT :id
  @Get('hr-manager/final-interviews-pending')
  @Roles(Role.HR_MANAGER)
  async getFinalInterviewsPending(@Req() req: Request & { user?: any }) {
    const userId = req.user?.userId || req.user?.sub;
    return this.applicationsService.getFinalInterviewsPending();
  }

// ✅ Valider un entretien technique
@Patch('technical/:id/validate')
@Roles(Role.RECRUITER)
async validateTechnical(
  @Param('id', ParseIntPipe) interviewId: number,
  @Body() body: { notes?: string; rating?: number },
  @Req() req: Request & { user?: any },
) {
  const userId = req.user?.userId || req.user?.sub;
  return this.applicationsService.validateTechnicalInterview(interviewId, userId, body.notes);
}

// ❌ Rejeter après technique
@Patch('technical/:id/reject')
@Roles(Role.RECRUITER)
async rejectTechnical(
  @Param('id', ParseIntPipe) interviewId: number,
  @Body() body: { notes?: string },
  @Req() req: Request & { user?: any },
) {
  const userId = req.user?.userId || req.user?.sub;
  return this.applicationsService.rejectTechnicalInterview(interviewId, userId, body.notes);
}





  // ✅ Voir mes candidatures (CANDIDATE)
  @Get('my-applications')
  @Roles(Role.CANDIDATE)
  findMyApplications(@Req() request: Request & { user?: any }) {
    const userId = request.user?.userId || request.user?.sub;
    return this.applicationsService.findAllByCandidate(userId);
  }

  // ═══════════════════════════════════════════════════════════════

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
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async create(
    @Req() request: Request & { user?: any },
    @Body() createApplicationDto: CreateApplicationDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Le CV est obligatoire');
    }

    const userId = request.user?.userId || request.user?.sub;

    if (!userId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    const cvPath = `/uploads/${file.filename}`;

    return this.applicationsService.create(userId, {
      ...createApplicationDto,
      cvPath,
    });
  }

  // Voir les candidatures d'une offre (RECRUITER, HR_MANAGER, ADMIN)
  @Get('job/:jobId')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  findByJob(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;
    const role = request.user?.role;

    return this.applicationsService.findAllByJob(jobId, userId, role);
  }

  // Voir une candidature spécifique
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;
    const role = request.user?.role;
    return this.applicationsService.findOne(id, userId, role);
  }

  // Pré-sélectionner un candidat (RECRUITER)
  @Patch(':id/shortlist')
  @Roles(Role.RECRUITER)
  shortlist(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;
    return this.applicationsService.shortlist(id, userId);
  }

  // Rejeter un candidat (RECRUITER, HR_MANAGER, ADMIN)
  @Patch(':id/reject')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;
    const role = request.user?.role;
    return this.applicationsService.reject(id, userId, role);
  }

  // Changer le statut d'une candidature
  @Patch(':id/status')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: ApplicationStatus,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;
    const role = request.user?.role;
    return this.applicationsService.updateStatus(id, status, userId, role);
  }

  // Supprimer une candidature
  @Delete(':id')
  @Roles(Role.RECRUITER, Role.HR_MANAGER, Role.ADMIN)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: Request & { user?: any },
  ) {
    const userId = request.user?.userId || request.user?.sub;
    const role = request.user?.role;
    return this.applicationsService.delete(id, userId, role);
  }
}
/* import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
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
} */
import { Controller, Post, UseInterceptors, UploadedFile, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApplicationsService } from '../applications/applications.service';

@Controller('candidate')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('CANDIDATE')
export class CandidateController {
  constructor(private applicationsService: ApplicationsService) {}

  @Post('apply')
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
          return callback(new Error('Seuls les fichiers PDF, DOC et DOCX sont autorisés'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
  )
  async apply(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    const candidateId = req.user.userId || req.user.sub;

    if (!file) {
      throw new BadRequestException('Le CV est obligatoire');
    }

    // ✅ IMPORTANT : Stocker UNIQUEMENT le nom du fichier
    const cvPath = file.filename;

    return this.applicationsService.create(candidateId, {
      jobId: parseInt(body.jobId),
      coverLetter: body.coverLetter,
      cvPath: cvPath, // ✅ Seulement le nom du fichier
    });
  }
}
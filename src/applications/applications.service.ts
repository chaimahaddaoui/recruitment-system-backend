
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { DjangoAiService } from '../django-ai/django-ai.service'; // ✅ IMPORT
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationStatus } from '@prisma/client';
import * as fs from 'fs';

@Injectable()
export class ApplicationsService {
  [x: string]: any;
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private djangoAiService: DjangoAiService, // ✅ INJECTION
  ) {}

  async create(candidateId: number, createApplicationDto: any) {
    console.log('📝 Service - candidateId:', candidateId);
    console.log('📝 Service - DTO:', createApplicationDto);

    if (!candidateId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    // Vérifier que le job existe et est ouvert
    const job = await this.prisma.job.findUnique({
      where: { id: createApplicationDto.jobId },
    });

    if (!job) {
      throw new NotFoundException('Offre d\'emploi introuvable');
    }

    if (job.status !== 'OPEN') {
      throw new BadRequestException('Cette offre n\'est plus ouverte aux candidatures');
    }

    // Vérifier que le candidat n'a pas déjà postulé
    const existingApplication = await this.prisma.application.findFirst({
      where: {
        jobId: createApplicationDto.jobId,
        candidateId: candidateId,
      },
    });

    if (existingApplication) {
      throw new BadRequestException('Vous avez déjà postulé à cette offre');
    }

    // Créer la candidature
    const application = await this.prisma.application.create({
      data: {
        jobId: createApplicationDto.jobId,
        candidateId: candidateId,
        coverLetter: createApplicationDto.coverLetter,
        cvPath: createApplicationDto.cvPath,
        status: ApplicationStatus.SUBMITTED,
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            contractType: true,
            description: true,
            requirements: true,
            skills: true,
            experienceYears: true,
          },
        },
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    // ✅ ANALYSE IA ASYNCHRONE (ne bloque pas la réponse)
    if (application.cvPath) {
      this.performAiAnalysis(application.id, application.cvPath, application.job)
        .catch((error) => {
          this.logger.error(`❌ Erreur analyse IA pour candidature #${application.id}:`, error);
        });
    } else {
      this.logger.warn(`⚠️ Aucun CV fourni pour la candidature #${application.id}`);
    }

    // ✅ EMAIL CONFIRMATION
    try {
      await this.emailService.sendApplicationConfirmation(
        application.candidate.email,
        `${application.candidate.firstName} ${application.candidate.lastName}`,
        application.job.title,
      );
    } catch (error: any) {
      this.logger.error('Erreur envoi email confirmation:', error);
    }

    return application;
  }

  /**
   * ✅ ANALYSE IA ASYNCHRONE
   */
 /**
 * ✅ ANALYSE IA ASYNCHRONE
 */
/**
 * ✅ ANALYSE IA COMPLÈTE AVEC UPLOAD DU FICHIER CV
 */
  private async performAiAnalysis(
  applicationId: number,
  cvPath: string,
  job: any,
): Promise<void> {
  try {
    this.logger.log(`🤖 Démarrage analyse IA pour candidature #${applicationId}`);

    if (!cvPath) {
      this.logger.error(`❌ Aucun chemin CV fourni pour candidature #${applicationId}`);
      return;
    }

    const path = require('path');
    const fs = require('fs');

    // Nettoyer le chemin reçu depuis la base
    const cleanCvPath = cvPath.replace(/^\/+/, '');
    const fileName = path.basename(cleanCvPath);

    // Chercher le fichier dans plusieurs emplacements possibles
    const possiblePaths = [
      path.join(process.cwd(), cleanCvPath),
      path.join(process.cwd(), 'uploads', fileName),
      path.join(process.cwd(), 'uploads', 'cvs', fileName),
    ];

    const foundCvPath = possiblePaths.find((possiblePath) =>
      fs.existsSync(possiblePath),
    );

    const fullCvPath =
      foundCvPath || path.join(process.cwd(), 'uploads', 'cvs', fileName);

    this.logger.log(`📁 Chemin CV reçu : ${cvPath}`);
    this.logger.log(`📁 Chemin CV absolu : ${fullCvPath}`);

    if (!fs.existsSync(fullCvPath)) {
      this.logger.error(`❌ Fichier CV introuvable : ${fullCvPath}`);

      await this.prisma.application.update({
        where: { id: applicationId },
        data: {
          aiMatchScore: 0,
          aiAnalysis: {
            error: 'Fichier CV introuvable',
            cvPath,
            searchedPath: fullCvPath,
            possiblePaths,
          } as any,
        },
      });

      return;
    }

    const jobDescription = `
Titre du poste : ${job.title || 'Non spécifié'}

Description :
${job.description || 'Non spécifiée'}

Exigences :
${job.requirements || 'Non spécifiées'}

Compétences requises :
${job.skills?.join(', ') || 'Non spécifiées'}

Niveau d'études :
${job.educationLevel || 'Non spécifié'}

Lieu :
${job.location || 'Non spécifié'}

Type de contrat :
${job.contractType || 'Non spécifié'}
`.trim();

    const aiResult = await this.djangoAiService.analyzeAndMatch({
      cvPath: fullCvPath,
      jobDescription,
      jobSkills: job.skills || [],
      requiredExperience: job.experienceYears || 0,
    });

    this.logger.log(`📊 Résultat IA reçu pour candidature #${applicationId}`);

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        aiMatchScore: aiResult.matchingResult?.final_score || 0,
        aiAnalysis: {
          extractedData: aiResult.extractedData || null,
          matchingResult: aiResult.matchingResult || null,
          message: aiResult.message || null,
          analyzedAt: new Date().toISOString(),
        } as any,
      },
    });

    this.logger.log(
      `✅ Analyse IA terminée pour candidature #${applicationId} - Score: ${
        aiResult.matchingResult?.final_score || 0
      }%`,
    );
  } catch (error: any) {
    this.logger.error(
      `❌ Erreur analyse IA candidature #${applicationId}: ${error.message}`,
    );

    await this.prisma.application.update({
      where: { id: applicationId },
      data: {
        aiMatchScore: 0,
        aiAnalysis: {
          error: error.message,
          analyzedAt: new Date().toISOString(),
        } as any,
      },
    });
  }
}
  async findAllByCandidate(candidateId: number) {
    return this.prisma.application.findMany({
      where: { candidateId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            contractType: true,
            salaryMin: true,
            salaryMax: true,
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAllByJob(jobId: number, userId: number, role: string) {
    let job;

    if (role === 'RECRUITER') {
      job = await this.prisma.job.findFirst({
        where: {
          id: jobId,
          createdById: userId,
        },
      });
    } else {
      job = await this.prisma.job.findUnique({
        where: { id: jobId },
      });
    }

    if (!job) {
      throw new NotFoundException('Offre introuvable ou non autorisée');
    }

    return this.prisma.application.findMany({
      where: { jobId },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        aiMatchScore: 'desc', // ✅ TRI PAR SCORE IA
      },
    });
  }

  async findOne(id: number, userId: number, userRole: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: {
          include: {
            createdBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    if (userRole === 'CANDIDATE' && application.candidateId !== userId) {
      throw new BadRequestException('Non autorisé');
    }

    if (userRole === 'RECRUITER' && application.job.createdById !== userId) {
      throw new BadRequestException('Non autorisé');
    }

    return application;
  }

  async shortlist(id: number, recruiterId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        candidate: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    if (application.job.createdById !== recruiterId) {
      throw new ForbiddenException('Accès refusé');
    }

    if (application.status !== ApplicationStatus.SUBMITTED) {
      throw new BadRequestException('Statut invalide');
    }

    const updated = await this.prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.SHORTLISTED },
      include: {
        job: true,
        candidate: true,
      },
    });

    await this.emailService.sendShortlistNotification(
      updated.candidate.email,
      `${updated.candidate.firstName} ${updated.candidate.lastName}`,
      updated.job.title,
    );

    return updated;
  }

  async reject(id: number, userId: number, role: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        candidate: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    if (role === 'RECRUITER' && application.job.createdById !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    const updated = await this.prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.REJECTED },
      include: {
        job: true,
        candidate: true,
      },
    });

    await this.emailService.sendRejection(
      updated.candidate.email,
      `${updated.candidate.firstName} ${updated.candidate.lastName}`,
      updated.job.title,
    );

    return updated;
  }

  async updateStatus(id: number, status: ApplicationStatus, userId: number, role: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    if (role === 'RECRUITER' && application.job.createdById !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    return this.prisma.application.update({
      where: { id },
      data: { status },
    });
  }



async getFinalInterviewsPending() {
  const applications = await this.prisma.application.findMany({
    where: {
      status: ApplicationStatus.INTERVIEW_HR_FINAL,
    },
    include: {
      candidate: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      job: {
        select: {
          id: true,
          title: true,
          location: true,
          salaryMin: true,
          salaryMax: true,
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      interviews: {
        where: {
          type: 'HR_FINAL',
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  });
 
  return {
    count: applications.length,
    applications: applications,
  };
}






  async getApplicationById(id: number) {
  return this.prisma.application.findUnique({
    where: { id },
    include: {
      candidate: true,
      job: true,
    },
  });
}





  async delete(id: number, userId: number, role: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    if (role === 'RECRUITER' && application.job.createdById !== userId) {
      throw new ForbiddenException('Accès refusé');
    }

    return this.prisma.application.delete({
      where: { id },
    });
  }

async validateTechnicalInterview(
  interviewId: number,
  recruiterId: number,
  notes?: string,
  
) {
  const interview = await this.prisma.interview.findUnique({
    where: { id: interviewId },
    include: { application: { include: { job: true, candidate: true } } },
  });

  if (!interview) throw new NotFoundException('Entretien introuvable');
  if (interview.application.job.createdById !== recruiterId) {
    throw new ForbiddenException('Non autorisé');
  }

  // ✅ Marque entretien comme complété
  await this.prisma.interview.update({
    where: { id: interviewId },
    data: { status: 'COMPLETED', notes,  completedAt: new Date() },
  });

  // ✅ Passe candidat à HR_FINAL
  const updated = await this.prisma.application.update({
    where: { id: interview.applicationId },
    data: { status: ApplicationStatus.INTERVIEW_HR_FINAL },
    include: { candidate: true, job: true },
  });

  // ✅ Email au candidat
  await this.emailService.sendEmailValidatedTechnical(
    updated.candidate.email,
    `${updated.candidate.firstName} ${updated.candidate.lastName}`,
    updated.job.title,
  );

  return updated;
}

async rejectTechnicalInterview(
  interviewId: number,
  recruiterId: number,
  notes?: string,
) {
  const interview = await this.prisma.interview.findUnique({
    where: { id: interviewId },
    include: { application: { include: { job: true, candidate: true } } },
  });

  if (!interview) throw new NotFoundException('Entretien introuvable');
  if (interview.application.job.createdById !== recruiterId) {
    throw new ForbiddenException('Non autorisé');
  }

  await this.prisma.interview.update({
    where: { id: interviewId },
    data: { status: 'REJECTED' as any, notes, completedAt: new Date() },
  });

  const updated = await this.prisma.application.update({
    where: { id: interview.applicationId },
    data: { status: ApplicationStatus.REJECTED },
    include: { candidate: true, job: true },
  });

  await this.emailService.sendRejection(
    updated.candidate.email,
    `${updated.candidate.firstName} ${updated.candidate.lastName}`,
    updated.job.title,
  );

  return updated;
}



}

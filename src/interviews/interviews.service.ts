/* import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { EvaluateInterviewDto } from './dto/evaluate-interview.dto';
import { InterviewType, InterviewStatus, ApplicationStatus, Role } from '@prisma/client';

@Injectable()
export class InterviewsService {
  getAvailability(userId: any, date: string) {
    throw new Error('Method not implemented.');
  }
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(userId: number, userRole: string, createInterviewDto: CreateInterviewDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: createInterviewDto.applicationId },
      include: { 
        job: true,
        candidate: true, // ✅ AJOUT pour email
      },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    this.validatePermissions(userRole, application, createInterviewDto.type);
    this.validateApplicationStatus(application.status, createInterviewDto.type);

    const interview = await this.prisma.interview.create({
      data: {
        applicationId: createInterviewDto.applicationId,
        type: createInterviewDto.type,
        scheduledAt: new Date(createInterviewDto.scheduledAt),
        duration: createInterviewDto.duration,
        location: createInterviewDto.location,
        notes: createInterviewDto.notes,
        interviewerId: userId,
        status: InterviewStatus.SCHEDULED,
      },
      include: {
        application: {
          include: {
            candidate: true,
            job: true,
          },
        },
      },
    });

    const currentStatus = application.status;
    const expectedStatus = this.getStatusForInterviewType(createInterviewDto.type);

    if (currentStatus !== expectedStatus) {
      await this.prisma.application.update({
        where: { id: createInterviewDto.applicationId },
        data: { status: expectedStatus },
      });
    }

    // ✅ ENVOI EMAIL : Entretien planifié
    await this.emailService.sendInterviewScheduled(
      interview.application.candidate.email,
      `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`,
      interview.application.job.title,
      createInterviewDto.type,
      interview.scheduledAt,
      interview.location ?? 'Non spécifié', 
      interview.duration ?? 0, // Durée par défaut de 60 minutes si non spécifiée
    );

    return interview;
  }

  async evaluate(
    interviewId: number,
    userId: number,
    userRole: string,
    evaluateDto: EvaluateInterviewDto,
  ) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
      include: {
        application: {
          include: { 
            job: true,
            candidate: true, // ✅ AJOUT pour email
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Entretien introuvable');
    }

    if (interview.interviewerId !== userId) {
      throw new ForbiddenException('Vous ne pouvez évaluer que vos propres entretiens');
    }

    const updatedInterview = await this.prisma.interview.update({
      where: { id: interviewId },
      data: {
        evaluation: evaluateDto.evaluation,
        passed: evaluateDto.passed,
        notes: evaluateDto.notes,
        status: evaluateDto.passed ? InterviewStatus.PASSED : InterviewStatus.FAILED,
        completedAt: new Date(),
      },
    });

    let newApplicationStatus: ApplicationStatus;

    if (evaluateDto.passed) {
      newApplicationStatus = this.getNextStatusAfterInterview(interview.type);
    } else {
      newApplicationStatus = ApplicationStatus.REJECTED;
    }

    console.log('🔄 Mise à jour statut candidature:', {
      interviewType: interview.type,
      passed: evaluateDto.passed,
      currentStatus: interview.application.status,
      newStatus: newApplicationStatus,
    });

    await this.prisma.application.update({
      where: { id: interview.applicationId },
      data: { status: newApplicationStatus },
    });

    // ✅ ENVOI EMAIL selon le résultat
    if (evaluateDto.passed) {
      const nextSteps: Record<string, string> = {
        HR_SCREENING: 'Vous passerez prochainement un entretien technique',
        TECHNICAL: 'Vous passerez prochainement un entretien RH final',
        HR_FINAL: 'Vous recevrez une offre d\'emploi formelle',
      };

      if (interview.type === InterviewType.HR_FINAL) {
        // ✅ Offre d'embauche
        await this.emailService.sendOfferAccepted(
          interview.application.candidate.email,
          `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`,
          interview.application.job.title,
        );
      } else {
        // ✅ Passage à l'étape suivante
        await this.emailService.sendInterviewPassed(
          interview.application.candidate.email,
          `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`,
          interview.application.job.title,
          interview.type,
          nextSteps[interview.type],
        );
      }
    } else {
      // ✅ Rejet
      await this.emailService.sendRejection(
        interview.application.candidate.email,
        `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`,
        interview.application.job.title,
      );
    }

    return updatedInterview;
  }

  async cancel(interviewId: number, userId: number) {
    const interview = await this.prisma.interview.findUnique({
      where: { id: interviewId },
    });

    if (!interview) {
      throw new NotFoundException('Entretien introuvable');
    }

    if (interview.interviewerId !== userId) {
      throw new ForbiddenException('Vous ne pouvez annuler que vos propres entretiens');
    }

    return this.prisma.interview.update({
      where: { id: interviewId },
      data: { status: InterviewStatus.CANCELLED },
    });
  }

  async getMyInterviews(userId: number) {
    return this.prisma.interview.findMany({
      where: { interviewerId: userId },
      include: {
        application: {
          include: {
            candidate: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            job: {
              select: {
                title: true,
              },
            },
          },
        },
        interviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  async getInterviewsByApplication(applicationId: number) {
    return this.prisma.interview.findMany({
      where: { applicationId },
      include: {
        interviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  // ========== HELPERS ==========

  private validatePermissions(userRole: string, application: any, interviewType: InterviewType) {
    if (interviewType === InterviewType.HR_SCREENING || interviewType === InterviewType.HR_FINAL) {
      if (userRole !== Role.HR_MANAGER && userRole !== Role.ADMIN) {
        throw new ForbiddenException('Seul le RH Manager peut planifier des entretiens RH');
      }
    }

    if (interviewType === InterviewType.TECHNICAL) {
      if (userRole !== Role.RECRUITER && userRole !== Role.ADMIN) {
        throw new ForbiddenException('Seul le recruteur peut planifier des entretiens techniques');
      }
    }
  }

  private validateApplicationStatus(currentStatus: ApplicationStatus, interviewType: InterviewType) {
    if (interviewType === InterviewType.HR_SCREENING) {
      if (currentStatus !== ApplicationStatus.SHORTLISTED) {
        throw new BadRequestException(
          'Le candidat doit être pré-sélectionné avant l\'entretien RH screening',
        );
      }
    }

    if (interviewType === InterviewType.TECHNICAL) {
      if (currentStatus !== ApplicationStatus.INTERVIEW_HR_SCREENING) {
        throw new BadRequestException(
          'Le candidat doit avoir passé l\'entretien RH screening',
        );
      }
    }

    if (interviewType === InterviewType.HR_FINAL) {
      if (currentStatus !== ApplicationStatus.INTERVIEW_HR_FINAL) {
        throw new BadRequestException(
          `Le candidat doit avoir passé l'entretien technique (statut actuel: ${currentStatus})`,
        );
      }
    }
  }

  private getStatusForInterviewType(type: InterviewType): ApplicationStatus {
    switch (type) {
      case InterviewType.HR_SCREENING:
        return ApplicationStatus.INTERVIEW_HR_SCREENING;
      case InterviewType.TECHNICAL:
        return ApplicationStatus.INTERVIEW_TECHNICAL;
      case InterviewType.HR_FINAL:
        return ApplicationStatus.INTERVIEW_HR_FINAL;
      default:
        throw new BadRequestException('Type d\'entretien invalide');
    }
  }

  private getNextStatusAfterInterview(type: InterviewType): ApplicationStatus {
    console.log('📋 Type entretien validé:', type);

    switch (type) {
      case InterviewType.HR_SCREENING:
        console.log('✅ Après RH #1 → Reste INTERVIEW_HR_SCREENING (prêt pour technique)');
        return ApplicationStatus.INTERVIEW_HR_SCREENING;

      case InterviewType.TECHNICAL:
        console.log('✅ Après technique → Passe à INTERVIEW_HR_FINAL (prêt pour RH final)');
        return ApplicationStatus.INTERVIEW_HR_FINAL;

      case InterviewType.HR_FINAL:
        console.log('✅ Après RH final → Passe à ACCEPTED');
        return ApplicationStatus.ACCEPTED;

      default:
        throw new BadRequestException('Type d\'entretien invalide');
    }
  }
} */

  import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  InterviewStatus,
  InterviewType,
  Role,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { EvaluateInterviewDto } from './dto/evaluate-interview.dto';

@Injectable()
export class InterviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, role: Role, dto: CreateInterviewDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: dto.applicationId },
      include: {
        job: true,
        candidate: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    const duration = dto.duration || 60;

    if (isNaN(scheduledAt.getTime())) {
      throw new BadRequestException('Date d’entretien invalide');
    }

    if (duration <= 0) {
      throw new BadRequestException('La durée doit être supérieure à 0');
    }

    const newInterviewEnd = new Date(scheduledAt);
    newInterviewEnd.setMinutes(newInterviewEnd.getMinutes() + duration);

    /**
     * Vérification des conflits :
     * Un conflit existe si :
     * nouvelDébut < ancienFin ET nouvelFin > ancienDébut
     */
    const sameDayStart = new Date(scheduledAt);
    sameDayStart.setHours(0, 0, 0, 0);

    const sameDayEnd = new Date(scheduledAt);
    sameDayEnd.setHours(23, 59, 59, 999);

    const interviewsOfDay = await this.prisma.interview.findMany({
      where: {
        interviewerId: Number(userId),
        status: {
          not: InterviewStatus.CANCELLED,
        },
        scheduledAt: {
          gte: sameDayStart,
          lte: sameDayEnd,
        },
      },
    });

    const conflict = interviewsOfDay.find((interview) => {
      const existingStart = new Date(interview.scheduledAt);
      const existingEnd = new Date(existingStart);
      existingEnd.setMinutes(
        existingEnd.getMinutes() + (interview.duration || 60),
      );

      return scheduledAt < existingEnd && newInterviewEnd > existingStart;
    });

    if (conflict) {
      throw new BadRequestException(
        'Ce créneau est déjà réservé. Veuillez choisir un autre horaire.',
      );
    }

    const interview = await this.prisma.interview.create({
      data: {
        applicationId: dto.applicationId,
        type: dto.type as InterviewType,
        scheduledAt,
        duration,
        location: dto.location,
        notes: dto.notes,
        interviewerId: Number(userId),
        status: InterviewStatus.SCHEDULED,
      },
      include: {
        application: {
          include: {
            candidate: true,
            job: true,
          },
        },
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    await this.updateApplicationStatus(dto.applicationId, dto.type as InterviewType);

    return interview;
  }

  async getAvailability(userId: number, date: string) {
    if (!date) {
      throw new BadRequestException('La date est obligatoire');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    if (isNaN(startOfDay.getTime())) {
      throw new BadRequestException('Date invalide');
    }

    const interviews = await this.prisma.interview.findMany({
      where: {
        interviewerId: Number(userId),
        status: {
          not: InterviewStatus.CANCELLED,
        },
        scheduledAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        application: {
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
              },
            },
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });

    return interviews.map((interview) => {
      const start = new Date(interview.scheduledAt);
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + (interview.duration || 60));

      return {
        id: interview.id,
        type: interview.type,
        status: interview.status,
        start,
        end,
        scheduledAt: interview.scheduledAt,
        duration: interview.duration || 60,
        location: interview.location,
        candidate: interview.application?.candidate
          ? `${interview.application.candidate.firstName} ${interview.application.candidate.lastName}`
          : null,
        candidateEmail: interview.application?.candidate?.email || null,
        jobTitle: interview.application?.job?.title || null,
      };
    });
  }

  async evaluate(
    id: number,
    userId: number,
    role: Role,
    dto: EvaluateInterviewDto,
  ) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!interview) {
      throw new NotFoundException('Entretien introuvable');
    }

    if (interview.interviewerId !== Number(userId) && role !== Role.ADMIN) {
      throw new ForbiddenException(
        'Vous n’êtes pas autorisé à évaluer cet entretien',
      );
    }

    const newStatus = dto.passed
      ? InterviewStatus.PASSED
      : InterviewStatus.FAILED;

    const updatedInterview = await this.prisma.interview.update({
      where: { id },
      data: {
        evaluation: dto.evaluation,
        passed: dto.passed,
        notes: dto.notes,
        status: newStatus,
        completedAt: new Date(),
      },
      include: {
        application: {
          include: {
            candidate: true,
            job: true,
          },
        },
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!dto.passed) {
      await this.prisma.application.update({
        where: { id: interview.applicationId },
        data: {
          status: ApplicationStatus.REJECTED,
        },
      });
    }

    return updatedInterview;
  }

  async cancel(id: number, userId: number) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
    });

    if (!interview) {
      throw new NotFoundException('Entretien introuvable');
    }

    if (interview.interviewerId !== Number(userId)) {
      throw new ForbiddenException(
        'Vous n’êtes pas autorisé à annuler cet entretien',
      );
    }

    return this.prisma.interview.update({
      where: { id },
      data: {
        status: InterviewStatus.CANCELLED,
      },
      include: {
        application: {
          include: {
            candidate: true,
            job: true,
          },
        },
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getMyInterviews(userId: number) {
    return this.prisma.interview.findMany({
      where: {
        interviewerId: Number(userId),
      },
      include: {
        application: {
          include: {
            candidate: true,
            job: true,
          },
        },
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  async getInterviewsByApplication(applicationId: number) {
    return this.prisma.interview.findMany({
      where: {
        applicationId,
      },
      include: {
        interviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  private async updateApplicationStatus(
    applicationId: number,
    interviewType: InterviewType,
  ) {
    let status: ApplicationStatus;

    switch (interviewType) {
      case InterviewType.HR_SCREENING:
        status = ApplicationStatus.INTERVIEW_HR_SCREENING;
        break;

      case InterviewType.TECHNICAL:
        status = ApplicationStatus.INTERVIEW_TECHNICAL;
        break;

      case InterviewType.HR_FINAL:
        status = ApplicationStatus.INTERVIEW_HR_FINAL;
        break;

      default:
        return;
    }

    await this.prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });
  }
}
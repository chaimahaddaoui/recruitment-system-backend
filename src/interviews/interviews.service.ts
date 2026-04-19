import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { EvaluateInterviewDto } from './dto/evaluate-interview.dto';
import { InterviewType, InterviewStatus, ApplicationStatus, Role } from '@prisma/client';

@Injectable()
export class InterviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, userRole: string, createInterviewDto: CreateInterviewDto) {
    const application = await this.prisma.application.findUnique({
      where: { id: createInterviewDto.applicationId },
      include: { job: true },
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
    });

    const currentStatus = application.status;
    const expectedStatus = this.getStatusForInterviewType(createInterviewDto.type);

    if (currentStatus !== expectedStatus) {
      await this.prisma.application.update({
        where: { id: createInterviewDto.applicationId },
        data: { status: expectedStatus },
      });
    }

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
          include: { job: true },
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
      // ✅ CORRECTION : Vérifier INTERVIEW_HR_FINAL
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
}
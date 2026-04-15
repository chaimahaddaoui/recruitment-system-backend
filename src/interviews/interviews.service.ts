import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { EvaluateInterviewDto } from './dto/evaluate-interview.dto';
import { InterviewType, ApplicationStatus, InterviewStatus } from '@prisma/client';

@Injectable()
export class InterviewsService {
  constructor(private prisma: PrismaService) {}

  // Planifier un entretien
  async create(createInterviewDto: CreateInterviewDto, interviewerId: number, role: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: createInterviewDto.applicationId },
      include: {
        job: true,
        interviews: true,
      },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    // Vérifier les permissions selon le type d'entretien
    if (createInterviewDto.type === InterviewType.TECHNICAL) {
      // Seul le recruteur qui a créé l'offre peut planifier l'entretien technique
      if (role === 'RECRUITER' && application.job.createdById !== interviewerId) {
        throw new ForbiddenException('Seul le recruteur de cette offre peut planifier l\'entretien technique');
      }
    }

    if (
     createInterviewDto.type === InterviewType.HR_SCREENING ||
     createInterviewDto.type === InterviewType.HR_FINAL
    ) {
      // Seul le RH peut planifier les entretiens RH
      if (role !== 'HR_MANAGER' && role !== 'ADMIN') {
        throw new ForbiddenException('Seul le RH peut planifier les entretiens RH');
      }
    }

    // Vérifier que la candidature est au bon statut
    this.validateApplicationStatus(application.status, createInterviewDto.type);

    // Créer l'entretien
    const interview = await this.prisma.interview.create({
      data: {
        applicationId: createInterviewDto.applicationId,
        type: createInterviewDto.type,
        scheduledAt: new Date(createInterviewDto.scheduledAt),
        duration: createInterviewDto.duration,
        location: createInterviewDto.location,
        notes: createInterviewDto.notes,
        interviewerId,
        status: InterviewStatus.SCHEDULED,
      },
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
          },
        },
      },
    });

    // Mettre à jour le statut de la candidature
    const newStatus = this.getStatusForInterviewType(createInterviewDto.type);
    await this.prisma.application.update({
      where: { id: createInterviewDto.applicationId },
      data: { status: newStatus },
    });

    // TODO: Envoyer email au candidat

    return interview;
  }

  // Évaluer un entretien
  async evaluate(id: number, evaluateInterviewDto: EvaluateInterviewDto, interviewerId: number) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            job: true,
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException('Entretien introuvable');
    }

    if (interview.interviewerId !== interviewerId) {
      throw new ForbiddenException('Vous ne pouvez évaluer que vos propres entretiens');
    }

    if (interview.status === InterviewStatus.COMPLETED) {
      throw new BadRequestException('Cet entretien a déjà été évalué');
    }

    // Mettre à jour l'entretien
    const updatedInterview = await this.prisma.interview.update({
      where: { id },
      data: {
        evaluation: evaluateInterviewDto.evaluation,
        passed: evaluateInterviewDto.passed,
        notes: evaluateInterviewDto.notes || interview.notes,
        status: evaluateInterviewDto.passed ? InterviewStatus.PASSED : InterviewStatus.FAILED,
        completedAt: new Date(),
      },
    });

    // Mettre à jour le statut de la candidature
    if (evaluateInterviewDto.passed) {
      const nextStatus = this.getNextStatusAfterInterview(interview.type);
      await this.prisma.application.update({
        where: { id: interview.applicationId },
        data: { status: nextStatus },
      });
    } else {
      // Échec → Rejeté
      await this.prisma.application.update({
        where: { id: interview.applicationId },
        data: { status: ApplicationStatus.REJECTED },
      });
    }

    // TODO: Envoyer email au candidat

    return updatedInterview;
  }

  // Voir tous les entretiens d'une candidature
  async findByApplication(applicationId: number) {
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

  // Voir tous les entretiens planifiés par un utilisateur
  async findByInterviewer(interviewerId: number) {
    return this.prisma.interview.findMany({
      where: { interviewerId },
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
      },
      orderBy: {
        scheduledAt: 'asc',
      },
    });
  }

  // Annuler un entretien
  async cancel(id: number, interviewerId: number) {
    const interview = await this.prisma.interview.findUnique({
      where: { id },
    });

    if (!interview) {
      throw new NotFoundException('Entretien introuvable');
    }

    if (interview.interviewerId !== interviewerId) {
      throw new ForbiddenException('Vous ne pouvez annuler que vos propres entretiens');
    }

    return this.prisma.interview.update({
      where: { id },
      data: { status: InterviewStatus.CANCELLED },
    });
  }

  // --- Helpers ---

  private validateApplicationStatus(currentStatus: ApplicationStatus, interviewType: InterviewType) {
    if (interviewType === InterviewType.HR_SCREENING) {
      if (currentStatus !== ApplicationStatus.UNDER_REVIEW) {
        throw new BadRequestException('Le candidat doit être pré-sélectionné avant l\'entretien RH screening');
      }
    }

    if (interviewType === InterviewType.TECHNICAL) {
      if (currentStatus !== ApplicationStatus.INTERVIEW_SCHEDULED) {
        throw new BadRequestException('Le candidat doit avoir passé l\'entretien RH screening');
      }
    }

    if (interviewType === InterviewType.HR_FINAL) {
      if (currentStatus !== ApplicationStatus.INTERVIEW_SCHEDULED) {
        throw new BadRequestException('Le candidat doit avoir passé l\'entretien technique');
      }
    }
  }

  private getStatusForInterviewType(type: InterviewType): ApplicationStatus {
    switch (type) {
      case InterviewType.HR_SCREENING:
        return ApplicationStatus.INTERVIEW_SCHEDULED;
      case InterviewType.TECHNICAL:
        return ApplicationStatus.INTERVIEW_SCHEDULED;
      case InterviewType.HR_FINAL:
        return ApplicationStatus.INTERVIEW_SCHEDULED;
      default:
        throw new BadRequestException('Type d\'entretien invalide');
    }
  }

  private getNextStatusAfterInterview(type: InterviewType): ApplicationStatus {
    switch (type) {
      case InterviewType.HR_SCREENING:
        return ApplicationStatus.INTERVIEW_SCHEDULED; // Attend planification technique
      case InterviewType.TECHNICAL:
        return ApplicationStatus.INTERVIEW_SCHEDULED; // Attend planification RH final
      case InterviewType.HR_FINAL:
        return ApplicationStatus.ACCEPTED; // Candidat accepté !
      default:
        throw new BadRequestException('Type d\'entretien invalide');
    }
  }
}
/* import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService,) {}

  async create(candidateId: number, createApplicationDto: any){

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
    return this.prisma.application.create({
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

  //  CAS RECRUITER 
  if (role === 'RECRUITER') {
    job = await this.prisma.job.findFirst({
      where: {
        id: jobId,
        createdById: userId,
      },
    });
  } 
  //  CAS HR / ADMIN → accès à tous les jobs
  else {
    job = await this.prisma.job.findUnique({
      where: {
        id: jobId,
      },
    });
  }

  // ❌ si job introuvable
  if (!job) {
    throw new NotFoundException('Offre introuvable ou non autorisée');
  }

  // ✅ récupérer candidatures
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
      createdAt: 'desc',
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

    // Vérifier les permissions
    if (userRole === 'CANDIDATE' && application.candidateId !== userId) {
      throw new BadRequestException('Vous n\'êtes pas autorisé à voir cette candidature');
    }

    if (userRole === 'RECRUITER' && application.job.createdById !== userId) {
      throw new BadRequestException('Vous n\'êtes pas autorisé à voir cette candidature');
    }

    return application;
  }

 




// Pré-sélectionner un candidat (RECRUITER)
  async shortlist(id: number, recruiterId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    // Vérifier que c'est bien l'offre du recruteur
    if (application.job.createdById !== recruiterId) {
      throw new ForbiddenException('Vous ne pouvez gérer que les candidatures de vos offres');
    }

    if (application.status !== ApplicationStatus.SUBMITTED) {
      throw new BadRequestException('Seules les candidatures SUBMITTED peuvent être pré-sélectionnées');
    }

    return this.prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.SHORTLISTED },
      include: {
        candidate: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Rejeter un candidat (RECRUITER ou HR)
  async reject(id: number, userId: number, role: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    // Vérifier les permissions
    if (role === 'RECRUITER' && application.job.createdById !== userId) {
      throw new ForbiddenException('Vous ne pouvez gérer que les candidatures de vos offres');
    }

    return this.prisma.application.update({
      where: { id },
      data: { status: ApplicationStatus.REJECTED },
      include: {
        candidate: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Changer le statut d'une candidature
  async updateStatus(id: number, status: ApplicationStatus, userId: number, role: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    // Vérifier les permissions
    if (role === 'RECRUITER' && application.job.createdById !== userId) {
      throw new ForbiddenException('Vous ne pouvez gérer que les candidatures de vos offres');
    }

    return this.prisma.application.update({
      where: { id },
      data: { status },
    });
  }

  // Supprimer une candidature (RECRUITER, HR, ADMIN)
  async delete(id: number, userId: number, role: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!application) {
      throw new NotFoundException('Candidature introuvable');
    }

    if (role === 'RECRUITER' && application.job.createdById !== userId) {
      throw new ForbiddenException('Vous ne pouvez supprimer que les candidatures de vos offres');
    }

    return this.prisma.application.delete({
      where: { id },
    });
  }

} */
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service'; // ✅ AJOUT
import { CreateApplicationDto } from './dto/create-application.dto';
import { ApplicationStatus } from '@prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService, // ✅ AJOUT
  ) {}

  async create(candidateId: number, createApplicationDto: any) {
    console.log('📝 Service - candidateId:', candidateId);
    console.log('📝 Service - DTO:', createApplicationDto);

    if (!candidateId) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    const job = await this.prisma.job.findUnique({
      where: { id: createApplicationDto.jobId },
    });

    if (!job) {
      throw new NotFoundException('Offre d\'emploi introuvable');
    }

    if (job.status !== 'OPEN') {
      throw new BadRequestException('Cette offre n\'est plus ouverte aux candidatures');
    }

    const existingApplication = await this.prisma.application.findFirst({
      where: {
        jobId: createApplicationDto.jobId,
        candidateId: candidateId,
      },
    });

    if (existingApplication) {
      throw new BadRequestException('Vous avez déjà postulé à cette offre');
    }

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

    // ✅ EMAIL CONFIRMATION
    await this.emailService.sendApplicationConfirmation(
      application.candidate.email,
      `${application.candidate.firstName} ${application.candidate.lastName}`,
      application.job.title,
    );

    return application;
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
        createdAt: 'desc',
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

  // ✅ SHORTLIST + EMAIL
  async shortlist(id: number, recruiterId: number) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        candidate: true, // ✅ IMPORTANT
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

    // ✅ EMAIL SHORTLIST
    await this.emailService.sendShortlistNotification(
      updated.candidate.email,
      `${updated.candidate.firstName} ${updated.candidate.lastName}`,
      updated.job.title,
    );

    return updated;
  }

  // ✅ REJECT + EMAIL
  async reject(id: number, userId: number, role: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        candidate: true, // ✅ IMPORTANT
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

    // ✅ EMAIL REJET
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
}
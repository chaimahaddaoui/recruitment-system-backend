import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobStatus } from '@prisma/client';

@Injectable()
export class JobsService {
  publish(arg0: number, arg1: number, arg2: string) {
    throw new Error('Method not implemented.');
  }
  constructor(private prisma: PrismaService) {}

  // Créer une offre (toujours en DRAFT)
  async create(createJobDto: CreateJobDto, createdById: number) {
    console.log('📝 Creating job with createdById:', createdById);
    console.log('📝 Job data:', createJobDto);

    if (!createdById) {
      throw new BadRequestException('Utilisateur non authentifié');
    }

    return this.prisma.job.create({
      data: {
        ...createJobDto,
        createdById,
        status: JobStatus.DRAFT,
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
  }

  // Soumettre l'offre au RH pour validation (RECRUTEUR)
  async submitForValidation(id: number, recruiterId: number) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    if (job.createdById !== recruiterId) {
      throw new ForbiddenException('Vous ne pouvez soumettre que vos propres offres');
    }

    if (job.status !== JobStatus.DRAFT) {
      throw new BadRequestException('Seules les offres en brouillon peuvent être soumises');
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.OPEN,
      },
    });
  }

  // Valider et publier l'offre (RH)
  async validateAndPublish(id: number) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.OPEN,
        publishedAt: new Date(),
      },
    });
  }

  // Rejeter l'offre et renvoyer au recruteur (RH)
  async rejectAndSendBack(id: number, feedback: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    return this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.DRAFT,
        hrFeedback: feedback,
      },
    });
  }
/* // ✅ Modifier une offre (RECRUTEUR peut UNIQUEMENT modifier DRAFT, RH peut tout modifier)
async update(id: number, updateJobDto: UpdateJobDto, userId: number, role: string) {
  const job = await this.prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    throw new NotFoundException('Offre introuvable');
  }

  // ✅ RECRUTEUR peut modifier UNIQUEMENT ses offres en DRAFT
  if (role === 'RECRUITER') {
    if (job.createdById !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres offres');
    }
    if (job.status !== JobStatus.DRAFT) {
      throw new ForbiddenException('Vous ne pouvez modifier que les offres en brouillon');
    }
  }

  // ✅ HR_MANAGER et ADMIN peuvent modifier toutes les offres (DRAFT, OPEN, CLOSED)
  // Pas de restriction pour HR_MANAGER et ADMIN

  return this.prisma.job.update({
    where: { id },
    data: {
      ...updateJobDto,
      hrFeedback: null,
    },
  });
} */
// ✅ Modifier une offre
async update(id: number, updateJobDto: UpdateJobDto, userId: number, role: string) {
  const job = await this.prisma.job.findUnique({
    where: { id },
  });

  if (!job) {
    throw new NotFoundException('Offre introuvable');
  }

  // ✅ RECRUTEUR peut modifier UNIQUEMENT ses offres en DRAFT
  if (role === 'RECRUITER') {
    if (job.createdById !== userId) {
      throw new ForbiddenException('Vous ne pouvez modifier que vos propres offres');
    }
    if (job.status !== JobStatus.DRAFT) {
      throw new ForbiddenException('Vous ne pouvez modifier que les offres en brouillon. Cette offre a déjà été publiée.');
    }
  }

  // ✅ HR_MANAGER peut modifier toutes les offres (DRAFT, OPEN, CLOSED)
  // ✅ ADMIN peut modifier toutes les offres
  // Pas de restriction pour HR_MANAGER et ADMIN

  return this.prisma.job.update({
    where: { id },
    data: {
      ...updateJobDto,
      hrFeedback: null, // Réinitialiser le feedback RH lors de la modification
    },
  });
}
  // Supprimer une offre
  async remove(id: number, userId: number, role: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    // RECRUTEUR peut supprimer seulement ses offres en DRAFT sans candidatures
    if (role === 'RECRUITER') {
      if (job.createdById !== userId) {
        throw new ForbiddenException('Vous ne pouvez supprimer que vos propres offres');
      }
      if (job.status !== JobStatus.DRAFT) {
        throw new ForbiddenException('Vous ne pouvez supprimer que les offres en brouillon');
      }
      if (job._count.applications > 0) {
        throw new ForbiddenException('Impossible de supprimer une offre avec des candidatures');
      }
    }

    // HR et ADMIN peuvent supprimer toutes les offres
    return this.prisma.job.delete({
      where: { id },
    });
  }

  // ✅ NOUVEAU : Fermer une offre (RECRUTEUR & RH)
  async close(id: number, userId?: number, role?: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    // Si c'est un RECRUTEUR, vérifier qu'il est le propriétaire
    if (role === 'RECRUITER') {
      if (job.createdById !== userId) {
        throw new ForbiddenException('Vous ne pouvez fermer que vos propres offres');
      }
    }

    // RH et ADMIN peuvent fermer toutes les offres
    return this.prisma.job.update({
      where: { id },
      data: {
        status: JobStatus.CLOSED,
        closedAt: new Date(),
      },
    });
  }

  // Voir toutes les offres
  async findAll(userId: number, role: string) {
    if (role === 'HR_MANAGER' || role === 'ADMIN') {
      return this.prisma.job.findMany({
        include: {
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    // RECRUITER voit seulement ses offres
    return this.prisma.job.findMany({
      where: { createdById: userId },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // Voir les offres ouvertes (pour candidats)
  async findAllOpen() {
    return this.prisma.job.findMany({
      where: { status: JobStatus.OPEN },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
  }

  // ✅ Voir une offre (accessible à tous les rôles)
  async findOne(id: number) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Offre introuvable');
    }

    return job;
  }
}
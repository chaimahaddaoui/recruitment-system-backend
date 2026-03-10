import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { JobStatus, Role } from '@prisma/client';

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  // Créer une offre
  async create(userId: number, createJobDto: CreateJobDto) {
    return this.prisma.job.create({
      data: {
        ...createJobDto,
        createdById: userId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
  }

  // Lister toutes les offres ouvertes (pour candidats)
  async findAllOpen() {
    return this.prisma.job.findMany({
      where: {
        status: JobStatus.OPEN,
      },
      include: {
        createdBy: {
          select: {
            id: true,
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
        createdAt: 'desc',
      },
    });
  }

  // Lister toutes les offres (pour recruteurs/RH)
  async findAll(userId: number, userRole: Role) {
    // Si RECRUITER : seulement ses offres
    if (userRole === Role.RECRUITER) {
      return this.prisma.job.findMany({
        where: {
          createdById: userId,
        },
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

    // Si HR_MANAGER ou ADMIN : toutes les offres
    return this.prisma.job.findMany({
      include: {
        createdBy: {
          select: {
            id: true,
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
        createdAt: 'desc',
      },
    });
  }

  // Détails d'une offre
  async findOne(id: number) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            email: true,
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
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${id} not found`);
    }

    return job;
  }

  // Modifier une offre
  async update(id: number, userId: number, userRole: Role, updateJobDto: UpdateJobDto) {
    const job = await this.findOne(id);

    // Vérifier les permissions
    if (userRole === Role.RECRUITER && job.createdById !== userId) {
      throw new ForbiddenException('You can only update your own jobs');
    }

    return this.prisma.job.update({
      where: { id },
      data: updateJobDto,
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  // Supprimer une offre
  async remove(id: number, userId: number, userRole: Role) {
    const job = await this.findOne(id);

    // Vérifier les permissions
    if (userRole === Role.RECRUITER && job.createdById !== userId) {
      throw new ForbiddenException('You can only delete your own jobs');
    }

    return this.prisma.job.delete({
      where: { id },
    });
  }

  // Publier une offre (DRAFT → OPEN)
  async publish(id: number, userId: number, userRole: Role) {
    const job = await this.findOne(id);

    if (userRole === Role.RECRUITER && job.createdById !== userId) {
      throw new ForbiddenException('You can only publish your own jobs');
    }

    return this.prisma.job.update({
      where: { id },
      data: { status: JobStatus.OPEN },
    });
  }

  // Fermer une offre
  async close(id: number, userId: number, userRole: Role) {
    const job = await this.findOne(id);

    if (userRole === Role.RECRUITER && job.createdById !== userId) {
      throw new ForbiddenException('You can only close your own jobs');
    }

    return this.prisma.job.update({
      where: { id },
      data: { 
        status: JobStatus.CLOSED,
        closedAt: new Date(),
      },
    });
  }
}
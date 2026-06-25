/* import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Gauge, register } from 'prom-client';

@Injectable()
export class BusinessMetricsService implements OnModuleInit, OnModuleDestroy {
  private usersGauge: Gauge<string>;
  private recruitersGauge: Gauge<string>;
  private jobsGauge: Gauge<string>;
  private applicationsGauge: Gauge<string>;
  private interviewsGauge: Gauge<string>;
  private interval?: ReturnType<typeof setInterval>;

  constructor(private prisma: PrismaService) {
    this.usersGauge = new Gauge({
      name: 'users_total',
      help: 'Total users',
      registers: [register],
    });

    this.recruitersGauge = new Gauge({
      name: 'recruiters_total',
      help: 'Total recruiters',
      registers: [register],
    });

    this.jobsGauge = new Gauge({
      name: 'jobs_total',
      help: 'Total jobs',
      registers: [register],
    });

    this.applicationsGauge = new Gauge({
      name: 'applications_total',
      help: 'Total applications',
      registers: [register],
    });

    this.interviewsGauge = new Gauge({
      name: 'interviews_total',
      help: 'Total interviews',
      registers: [register],
    });
  }

  onModuleInit() {
    this.refreshMetrics();
    this.interval = setInterval(() => this.refreshMetrics(), 30_000);
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async refreshMetrics() {
    const users = await this.prisma.user.count();

    const recruiters = await this.prisma.user.count({
      where: {
        role: 'RECRUITER',
      },
    });

    const jobs = await this.prisma.job.count();

    const applications = await this.prisma.application.count();

    const interviews = await this.prisma.interview.count();

    this.usersGauge.set(users);
    this.recruitersGauge.set(recruiters);
    this.jobsGauge.set(jobs);
    this.applicationsGauge.set(applications);
    this.interviewsGauge.set(interviews);
  }


 


}
 */


import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Gauge, register } from 'prom-client';

@Injectable()
export class BusinessMetricsService implements OnModuleInit, OnModuleDestroy {
  private usersGauge: Gauge<string>;
  private recruitersGauge: Gauge<string>;
  private candidatesGauge: Gauge<string>;
  private jobsGauge: Gauge<string>;
  private openJobsGauge: Gauge<string>;
  private applicationsGauge: Gauge<string>;
  private interviewsGauge: Gauge<string>;

  private interval?: ReturnType<typeof setInterval>;

  constructor(private prisma: PrismaService) {
    this.usersGauge = new Gauge({
      name: 'users_total',
      help: 'Total users',
      registers: [register],
    });

    this.recruitersGauge = new Gauge({
      name: 'recruiters_total',
      help: 'Total recruiters',
      registers: [register],
    });

    this.candidatesGauge = new Gauge({
      name: 'candidates_total',
      help: 'Total candidates',
      registers: [register],
    });

    this.jobsGauge = new Gauge({
      name: 'jobs_total',
      help: 'Total jobs',
      registers: [register],
    });

    this.openJobsGauge = new Gauge({
      name: 'jobs_open_total',
      help: 'Total open jobs',
      registers: [register],
    });

    this.applicationsGauge = new Gauge({
      name: 'applications_total',
      help: 'Total applications',
      registers: [register],
    });

    this.interviewsGauge = new Gauge({
      name: 'interviews_total',
      help: 'Total interviews',
      registers: [register],
    });
  }

  onModuleInit() {
    this.refreshMetrics();
    this.interval = setInterval(() => this.refreshMetrics(), 30000);
  }

  onModuleDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async refreshMetrics() {
    const users = await this.prisma.user.count();

    const recruiters = await this.prisma.user.count({
      where: {
        role: 'RECRUITER',
      },
    });

    const candidates = await this.prisma.user.count({
      where: {
        role: 'CANDIDATE',
      },
    });

    const jobs = await this.prisma.job.count();

    const openJobs = await this.prisma.job.count({
      where: {
        status: 'OPEN',
      },
    });

    const applications = await this.prisma.application.count();

    const interviews = await this.prisma.interview.count();

    this.usersGauge.set(users);
    this.recruitersGauge.set(recruiters);
    this.candidatesGauge.set(candidates);
    this.jobsGauge.set(jobs);
    this.openJobsGauge.set(openJobs);
    this.applicationsGauge.set(applications);
    this.interviewsGauge.set(interviews);
  }
}
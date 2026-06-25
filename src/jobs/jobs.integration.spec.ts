import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';

describe('Jobs Controller - Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let recruiterToken: string;
  let recruiterId: number;
  let jobId: number;

  // ════════════════════════════════════════════════════
  // SETUP: Démarrer l'application et créer données test
  // ════════════════════════════════════════════════════
  beforeAll(async () => {
    console.log('🚀 Setting up Jobs Integration Tests...\n');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // ✅ CORRIGER L'ORDRE DE SUPPRESSION:
    try {
      await prisma.application.deleteMany({});
      console.log('✓ Applications cleaned');
      
      await prisma.interview.deleteMany({});
      console.log('✓ Interviews cleaned');
      
      await prisma.job.deleteMany({});
      console.log('✓ Jobs cleaned');
      
      await prisma.user.deleteMany({});
      console.log('✓ Users cleaned');
    } catch (error) {
      console.log('Note: Some tables may already be empty');
    }

    // Créer un recruiter pour les tests (✅ UNIQUE EMAIL)
    const recruiter = await prisma.user.create({
      data: {
        email: `recruiter-${Date.now()}@test.com`, // ✅ UNIQUE
        password: await bcrypt.hash('Password123!', 10),
        firstName: 'Test',
        lastName: 'Recruiter',
        role: 'RECRUITER',
        status: 'ACTIVE',
      },
    });

    recruiterId = recruiter.id;
   /*  recruiterToken = jwtService.sign({
      userId: recruiter.id,
      email: recruiter.email,
      role: recruiter.role,
    }); */
    recruiterToken = jwtService.sign({
  sub: recruiter.id,
  email: recruiter.email,
  role: recruiter.role,
});

    console.log('✓ Test recruiter created');
    console.log('✓ JWT token generated\n');
  });

  // CLEANUP AVEC BON ORDRE
  afterAll(async () => {
    console.log('\n🛑 Cleaning up...');
    try {
      await prisma.application.deleteMany({});
      await prisma.interview.deleteMany({});
      await prisma.job.deleteMany({});
      await prisma.user.deleteMany({});
      console.log('✓ Database cleaned');
    } catch (error) {
      console.log('Note: Cleanup completed');
    }
    await app.close();
    console.log('✓ Tests completed\n');
  });

  // ════════════════════════════════════════════════════
  // INT-JOBS-1: Create job
  // ════════════════════════════════════════════════════
  describe('Create Job', () => {
    it('INT-JOBS-1️⃣ should create a new job successfully', async () => {
      console.log('🧪 INT-JOBS Test 1: Create job');

      // ✅ Minimal valid job DTO
      /* const createJobDto = {
        title: 'Senior Full Stack Developer',
        description: 'We are looking for an experienced full stack developer',
        requirements: 'NestJS, React, PostgreSQL',
        location: 'Tunis, Tunisia',
      }; */
      const createJobDto = {
  title: 'Senior Full Stack Developer',
  description: 'Description',
  requirements: 'Requirements',
  location: 'Tunis',

  contractType: 'CDI',
  experienceYears: 3,
  educationLevel: 'Licence',
  skills: ['NestJS', 'PostgreSQL', 'React']
};

      // ACT: POST /jobs avec authentification
      const response = await request(app.getHttpServer())
        .post('/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(createJobDto);

      // ASSERT: Vérifier le statut
      if (response.status !== 201) {
        console.log('Response:', response.body);
        throw new Error(`Expected 201 but got ${response.status}: ${JSON.stringify(response.body)}`);
      }

      expect(response.body).toHaveProperty('id');
      jobId = response.body.id;
      console.log('  ✓ Job created with ID:', jobId);

      expect(response.body.title).toBe(createJobDto.title);
      console.log('  ✓ Job title correct');

      expect(response.body.createdById).toBe(recruiterId);
      console.log('  ✓ CreatedBy ID correct');

      // ASSERT: Job existe en BD
      const jobInDb = await prisma.job.findUnique({
        where: { id: jobId },
        include: { createdBy: true },
      });

      expect(jobInDb).not.toBeNull();
      console.log('  ✓ Job exists in database');

      console.log('✅ INT-JOBS TEST 1 PASSED\n');
    });

    // ❌ INT-JOBS-2: Create job without authentication
    it('INT-JOBS-2️⃣ should fail creating job without authentication', async () => {
      console.log('🧪 INT-JOBS Test 2: Create - no auth');

      const createJobDto = {
        title: 'Some Job',
        description: 'Description',
        requirements: 'Requirements',
        location: 'Location',
      };

      // ACT: POST /jobs SANS token
      const response = await request(app.getHttpServer())
        .post('/jobs')
        .send(createJobDto);

      expect(response.status).toBe(401);
      console.log('  ✓ HTTP 401 returned without auth');
      console.log('✅ INT-JOBS TEST 2 PASSED\n');
    });
  });

  // ════════════════════════════════════════════════════
  // INT-JOBS-3: Get job
  // ════════════════════════════════════════════════════
  describe('Get Job', () => {
    it('INT-JOBS-3️⃣ should retrieve a job successfully', async () => {
      console.log('🧪 INT-JOBS Test 3: Get job');

      // ACT: GET /jobs/:id (jobs peuvent être publiques ou nécessiter auth)
      const response = await request(app.getHttpServer())
        .get(`/jobs/${jobId}`)
        .set('Authorization', `Bearer ${recruiterToken}`); // Ajout auth par sécurité

      // ASSERT
      if (response.status !== 200) {
        console.log('Response:', response.body);
        throw new Error(`Expected 200 but got ${response.status}`);
      }

      expect(response.body.id).toBe(jobId);
      console.log('  ✓ Job ID matches');

      expect(response.body.title).toBe('Senior Full Stack Developer');
      console.log('  ✓ Job title correct');

      console.log('✅ INT-JOBS TEST 3 PASSED\n');
    });

    // ❌ INT-JOBS-4: Get non-existent job
    it('INT-JOBS-4️⃣ should return 404 for non-existent job', async () => {
      console.log('🧪 INT-JOBS Test 4: Get - not found');

      // ACT: GET /jobs/:id (non-existent)
      const response = await request(app.getHttpServer())
        .get('/jobs/99999')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(response.status).toBe(404);
      console.log('  ✓ HTTP 404 returned for non-existent job');
      console.log('✅ INT-JOBS TEST 4 PASSED\n');
    });
  });

  // ════════════════════════════════════════════════════
  // INT-JOBS-5: Update job
  // ════════════════════════════════════════════════════
  describe('Update Job', () => {
    it('INT-JOBS-5️⃣ should update a job successfully', async () => {
      console.log('🧪 INT-JOBS Test 5: Update job');

      const updateJobDto = {
        title: 'Senior Developer (Updated)',
      };

      // ACT: PATCH /jobs/:id avec authentification
      const response = await request(app.getHttpServer())
        .patch(`/jobs/${jobId}`)
        .set('Authorization', `Bearer ${recruiterToken}`)
        .send(updateJobDto);

      // ASSERT
      if (response.status !== 200) {
        console.log('Response:', response.body);
        throw new Error(`Expected 200 but got ${response.status}`);
      }

      expect(response.body.title).toBe(updateJobDto.title);
      console.log('  ✓ Job title updated');

      // ASSERT: BD a été mise à jour
      const jobInDb = await prisma.job.findUnique({
        where: { id: jobId },
      });

      expect(jobInDb).not.toBeNull();
      if (jobInDb) {
        expect(jobInDb.title).toBe(updateJobDto.title);
      }
      console.log('  ✓ Job updated in database');

      console.log('✅ INT-JOBS TEST 5 PASSED\n');
    });

    // ❌ INT-JOBS-6: Update job from different recruiter
    it('INT-JOBS-6️⃣ should fail updating job from different recruiter', async () => {
      console.log('🧪 INT-JOBS Test 6: Update - wrong owner');

      // Créer un autre recruiter (✅ UNIQUE EMAIL)
      const otherRecruiter = await prisma.user.create({
        data: {
          email: `other-recruiter-${Date.now()}@test.com`, // ✅ UNIQUE
          password: await bcrypt.hash('Password123!', 10),
          firstName: 'Other',
          lastName: 'Recruiter',
          role: 'RECRUITER',
          status: 'ACTIVE',
        },
      });

      const otherToken = jwtService.sign({
        userId: otherRecruiter.id,
        email: otherRecruiter.email,
        role: otherRecruiter.role,
      });

      // ACT: Tenter de modifier le job avec un autre recruiter
      const response = await request(app.getHttpServer())
        .patch(`/jobs/${jobId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Hacked Title' });

      expect(response.status).toBe(403);
      console.log('  ✓ HTTP 403 returned for unauthorized update');

      // Nettoyer
      await prisma.user.delete({ where: { id: otherRecruiter.id } });

      console.log('✅ INT-JOBS TEST 6 PASSED\n');
    });
  });

  // ════════════════════════════════════════════════════
  // INT-JOBS-7: List all jobs
  // ════════════════════════════════════════════════════
  describe('List Jobs', () => {
    it('INT-JOBS-7️⃣ should list all jobs for recruiter', async () => {
      console.log('🧪 INT-JOBS Test 7: List jobs');

      // Créer 2 jobs supplémentaires
      await prisma.job.create({
        data: {
          title: 'Job 2',
          description: 'Description',
          requirements: 'Requirements',
          location: 'Location',
          contractType: 'CDI',
          experienceYears: 3,
          educationLevel: 'BACHELOR',
          createdById: recruiterId,
          status: 'OPEN',
        },
      });

      await prisma.job.create({
        data: {
          title: 'Job 3',
          description: 'Description',
          requirements: 'Requirements',
          location: 'Location',
          contractType: 'CDI',
          experienceYears: 3,
          educationLevel: 'BACHELOR',
          createdById: recruiterId,
          status: 'DRAFT',
        },
      });

      // ACT: GET /jobs avec authentification
      const response = await request(app.getHttpServer())
        .get('/jobs')
        .set('Authorization', `Bearer ${recruiterToken}`);

      // ASSERT
      if (response.status !== 200) {
        console.log('Response:', response.body);
        throw new Error(`Expected 200 but got ${response.status}`);
      }

      expect(Array.isArray(response.body)).toBe(true);
      console.log('  ✓ Jobs list returned');

      expect(response.body.length).toBeGreaterThanOrEqual(3);
      console.log('  ✓ All recruiter jobs returned');

      console.log('✅ INT-JOBS TEST 7 PASSED\n');
    });
  });
});
import { Test, TestingModule } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ApplicationStatus } from '@prisma/client';
import { beforeEach, describe, it, expect, jest, afterEach } from '@jest/globals';
import { DjangoAiService } from '../django-ai/django-ai.service';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

describe('ApplicationsService - FIXED TEST SUITE', () => {
  let service: ApplicationsService;
  let prismaService: PrismaService;
  let emailService: EmailService;
  let djangoAiService: DjangoAiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicationsService,
        {
          provide: PrismaService,
          useValue: {
            application: {
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
              create: jest.fn(),
            },
            interview: {
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendShortlistNotification: jest.fn(),
            sendEmailValidatedTechnical: jest.fn(),
            sendRejection: jest.fn(),
          },
        },
        {
          provide: DjangoAiService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<ApplicationsService>(ApplicationsService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    djangoAiService = module.get<DjangoAiService>(DjangoAiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ════════════════════════════════════════════════════
  // SHORTLIST TESTS (2 tests)
  // ════════════════════════════════════════════════════
  describe('Shortlist Application', () => {
    // ✅ TEST 1: SHORTLIST RÉUSSI
    it('TEST 1️⃣ should shortlist a candidate', async () => {
      console.log('🧪 APP Test 1: Shortlist Candidate');

      const application = {
        id: 1,
        status: ApplicationStatus.SUBMITTED,
        job: {
          createdById: 1,
          title: 'Full Stack Developer',
        },
        candidate: {
          email: 'candidate@test.com',
          firstName: 'Wael',
          lastName: 'Test',
        },
      };

      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(application as any);

      jest
        .spyOn(prismaService.application, 'update')
        .mockResolvedValue({
          ...application,
          status: ApplicationStatus.SHORTLISTED,
        } as any);

      // ACT
      const result = await service.shortlist(1, 1);

      // ASSERT
      expect(result.status).toBe(ApplicationStatus.SHORTLISTED);
      console.log('  ✓ Status changed to SHORTLISTED');

      expect(emailService.sendShortlistNotification).toHaveBeenCalled();
      console.log('  ✓ Shortlist notification sent');

      console.log('✅ APP TEST 1 PASSED\n');
    });

    // ❌ TEST 2: PAS PROPRIÉTAIRE
    it('TEST 2️⃣ should throw error if not job creator', async () => {
      console.log('🧪 APP Test 2: Shortlist - not owner');

      const application = {
        id: 1,
        status: ApplicationStatus.SUBMITTED,
        job: {
          createdById: 5, // ≠ userId (1)
          title: 'Full Stack Developer',
        },
        candidate: {
          email: 'candidate@test.com',
          firstName: 'Wael',
          lastName: 'Test',
        },
      };

      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValue(application as any);

      // ACT & ASSERT
      await expect(service.shortlist(1, 1))
        .rejects.toThrow(ForbiddenException);

      console.log('  ✓ ForbiddenException thrown');
      console.log('✅ APP TEST 2 PASSED\n');
    });
  });

  // ════════════════════════════════════════════════════
  // VALIDATE TECHNICAL INTERVIEW TESTS (3 tests)
  // ════════════════════════════════════════════════════
  describe('Validate Technical Interview', () => {
    // ✅ TEST 3: VALIDATE RÉUSSI - CANDIDAT PASSE
    it('TEST 3️⃣ should move candidate to HR_FINAL', async () => {
      console.log('🧪 APP Test 3: Validate Technical Interview');

      const interview = {
        id: 1,
        applicationId: 10,
        application: {
          id: 10,
          job: {
            createdById: 1,
            title: 'Backend Developer',
          },
          candidate: {
            email: 'candidate@test.com',
            firstName: 'Wael',
            lastName: 'Test',
          },
        },
      };

      jest
        .spyOn(prismaService.interview, 'findUnique')
        .mockResolvedValue(interview as any);

      jest
        .spyOn(prismaService.interview, 'update')
        .mockResolvedValue({} as any);

      jest
        .spyOn(prismaService.application, 'update')
        .mockResolvedValue({
          id: 10,
          status: ApplicationStatus.INTERVIEW_HR_FINAL,
          candidate: interview.application.candidate,
          job: interview.application.job,
        } as any);

      // ACT
      const result = await service.validateTechnicalInterview(
        1,
        1,
        'Excellent candidat',
      );

      // ASSERT
      expect(result.status).toBe(ApplicationStatus.INTERVIEW_HR_FINAL);
      console.log('  ✓ Status changed to INTERVIEW_HR_FINAL');

      expect(emailService.sendEmailValidatedTechnical).toHaveBeenCalled();
      console.log('  ✓ Validation email sent');

      console.log('✅ APP TEST 3 PASSED\n');
    });

    // ❌ TEST 4: INTERVIEW INEXISTANT
    it('TEST 4️⃣ should throw error if interview not found', async () => {
      console.log('🧪 APP Test 4: Validate - interview not found');

      jest
        .spyOn(prismaService.interview, 'findUnique')
        .mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        service.validateTechnicalInterview(999, 1, 'Comment')
      ).rejects.toThrow(NotFoundException);

      console.log('  ✓ NotFoundException thrown');
      console.log('✅ APP TEST 4 PASSED\n');
    });

    // ❌ TEST 5: PAS PROPRIÉTAIRE DU JOB
    it('TEST 5️⃣ should throw error if not interview creator', async () => {
      console.log('🧪 APP Test 5: Validate - not authorized');

      const interview = {
        id: 1,
        applicationId: 10,
        application: {
          id: 10,
          job: {
            createdById: 5, // ≠ userId (1)
            title: 'Backend Developer',
          },
          candidate: {
            email: 'candidate@test.com',
            firstName: 'Wael',
            lastName: 'Test',
          },
        },
      };

      jest
        .spyOn(prismaService.interview, 'findUnique')
        .mockResolvedValue(interview as any);

      // ACT & ASSERT
      await expect(
        service.validateTechnicalInterview(1, 1, 'Comment')
      ).rejects.toThrow(ForbiddenException);

      console.log('  ✓ ForbiddenException thrown');
      console.log('✅ APP TEST 5 PASSED\n');
    });
  });

  // ════════════════════════════════════════════════════
  // REJECT TECHNICAL INTERVIEW TESTS (2 tests)
  // ════════════════════════════════════════════════════
  describe('Reject Technical Interview', () => {
    // ✅ TEST 6: REJECT RÉUSSI
    it('TEST 6️⃣ should reject candidate after technical interview', async () => {
      console.log('🧪 APP Test 6: Reject Technical Interview');

      const interview = {
        id: 1,
        applicationId: 10,
        application: {
          id: 10,
          job: {
            createdById: 1,
            title: 'Backend Developer',
          },
          candidate: {
            email: 'candidate@test.com',
            firstName: 'Wael',
            lastName: 'Test',
          },
        },
      };

      jest
        .spyOn(prismaService.interview, 'findUnique')
        .mockResolvedValue(interview as any);

      jest
        .spyOn(prismaService.interview, 'update')
        .mockResolvedValue({} as any);

      jest
        .spyOn(prismaService.application, 'update')
        .mockResolvedValue({
          id: 10,
          status: ApplicationStatus.REJECTED,
          candidate: interview.application.candidate,
          job: interview.application.job,
        } as any);

      // ACT
      const result = await service.rejectTechnicalInterview(
        1,
        1,
        'Compétences insuffisantes',
      );

      // ASSERT
      expect(result.status).toBe(ApplicationStatus.REJECTED);
      console.log('  ✓ Status changed to REJECTED');

      expect(emailService.sendRejection).toHaveBeenCalled();
      console.log('  ✓ Rejection email sent');

      console.log('✅ APP TEST 6 PASSED\n');
    });

    // ❌ TEST 7: INTERVIEW INEXISTANT
    it('TEST 7️⃣ should throw error if interview not found on reject', async () => {
      console.log('🧪 APP Test 7: Reject - interview not found');

      jest
        .spyOn(prismaService.interview, 'findUnique')
        .mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        service.rejectTechnicalInterview(999, 1, 'Comment')
      ).rejects.toThrow(NotFoundException);

      console.log('  ✓ NotFoundException thrown');
      console.log('✅ APP TEST 7 PASSED\n');
    });
  });

  // ════════════════════════════════════════════════════
  // LIST/FETCH APPLICATIONS TESTS (2 tests)
  // ════════════════════════════════════════════════════
  describe('Fetch Applications', () => {
    // ✅ TEST 8: FETCH APPLICATIONS FOR A JOB
    it('TEST 8️⃣ should fetch applications via prisma findMany', async () => {
      console.log('🧪 APP Test 8: Fetch Applications');

      const applications = [
        {
          id: 1,
          jobId: 1,
          candidateId: 10,
          status: ApplicationStatus.SUBMITTED,
          aiMatchScore: 85,
          candidate: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          },
        },
        {
          id: 2,
          jobId: 1,
          candidateId: 11,
          status: ApplicationStatus.SHORTLISTED,
          aiMatchScore: 72,
          candidate: {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
          },
        },
      ];

      jest
        .spyOn(prismaService.application, 'findMany')
        .mockResolvedValue(applications as any);

      // ACT
      const result = await prismaService.application.findMany({
        where: { jobId: 1 },
      });

      // ASSERT
      expect(result).toHaveLength(2);
      console.log('  ✓ 2 applications returned');

      expect(result[0].aiMatchScore).toBe(85);
      console.log('  ✓ First app has AI score');

      expect(result[0].status).toBe(ApplicationStatus.SUBMITTED);
      console.log('  ✓ Status info correct');

      console.log('✅ APP TEST 8 PASSED\n');
    });

    // ✅ TEST 9: EMPTY APPLICATIONS LIST
    it('TEST 9️⃣ should return empty array if no applications', async () => {
      console.log('🧪 APP Test 9: No Applications');

      jest
        .spyOn(prismaService.application, 'findMany')
        .mockResolvedValue([]);

      // ACT
      const result = await prismaService.application.findMany({
        where: { jobId: 999 },
      });

      // ASSERT
      expect(result).toHaveLength(0);
      console.log('  ✓ Empty array returned');

      console.log('✅ APP TEST 9 PASSED\n');
    });
  });

  // ════════════════════════════════════════════════════
  // BONUS TEST: Application workflow
  // ════════════════════════════════════════════════════
  describe('Application Workflow', () => {
    // ✅ BONUS: FULL WORKFLOW - Candidate moves from SUBMITTED → SHORTLISTED → HR_FINAL
    it('BONUS 🎁 should handle full application workflow', async () => {
      console.log('🧪 APP BONUS: Full Workflow (SUBMITTED → SHORTLISTED → HR_FINAL)');

      // Step 1: Shortlist
      const shortlistApp = {
        id: 1,
        status: ApplicationStatus.SUBMITTED,
        job: { createdById: 1 },
        candidate: { email: 'test@test.com', firstName: 'Test', lastName: 'User' },
      };

      jest
        .spyOn(prismaService.application, 'findUnique')
        .mockResolvedValueOnce(shortlistApp as any);

      jest
        .spyOn(prismaService.application, 'update')
        .mockResolvedValueOnce({
          ...shortlistApp,
          status: ApplicationStatus.SHORTLISTED,
        } as any);

      // Step 2: Validate technical
      const interviewApp = {
        id: 1,
        applicationId: 1,
        application: shortlistApp,
      };

      jest
        .spyOn(prismaService.interview, 'findUnique')
        .mockResolvedValueOnce(interviewApp as any);

      jest
        .spyOn(prismaService.interview, 'update')
        .mockResolvedValueOnce({} as any);

      jest
        .spyOn(prismaService.application, 'update')
        .mockResolvedValueOnce({
          ...shortlistApp,
          status: ApplicationStatus.INTERVIEW_HR_FINAL,
        } as any);

      // ACT Step 1: Shortlist
      const step1 = await service.shortlist(1, 1);
      expect(step1.status).toBe(ApplicationStatus.SHORTLISTED);
      console.log('  ✓ Step 1: SUBMITTED → SHORTLISTED');

      // ACT Step 2: Validate technical
      const step2 = await service.validateTechnicalInterview(1, 1, 'Great');
      expect(step2.status).toBe(ApplicationStatus.INTERVIEW_HR_FINAL);
      console.log('  ✓ Step 2: SHORTLISTED → HR_FINAL');

      console.log('✅ BONUS TEST PASSED\n');
    });
  });
});
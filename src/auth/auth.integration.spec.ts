import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../app.module';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { describe, it, expect, afterAll, beforeAll } from '@jest/globals';

describe('Auth Controller - Integration Tests (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // ════════════════════════════════════════════════════
  // SETUP: Démarrer l'application
  // ════════════════════════════════════════════════════
  beforeAll(async () => {
    console.log('🚀 Setting up Auth Integration Tests...\n');

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

    // ✅ CORRIGER L'ORDRE DE SUPPRESSION:
    try {
      await prisma.application.deleteMany({});
      console.log('✓ Applications cleaned');
      
      await prisma.interview.deleteMany({});
      console.log('✓ Interviews cleaned');
      
      await prisma.job.deleteMany({});
      console.log('✓ Jobs cleaned');
      
      await prisma.user.deleteMany({});
      console.log('✓ Users cleaned\n');
    } catch (error) {
      console.log('Note: Some tables may already be empty\n');
    }
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
  // INT-AUTH-1: Register with valid data
  // ════════════════════════════════════════════════════
  describe('Register', () => {
    it('INT-AUTH-1️⃣ should register a new user successfully', async () => {
      console.log('🧪 INT-AUTH Test 1: Register - success');

      const registerDto = {
        email: `newuser-${Date.now()}@example.com`, // ✅ UNIQUE
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CANDIDATE',
      };

      // ACT: Envoyer POST request
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      // ASSERT: Vérifier le statut
      expect(response.status).toBe(201);
      console.log('  ✓ HTTP 201 Created');

      expect(response.body).toHaveProperty('access_token');
      console.log('  ✓ Access token returned');

      expect(response.body.user.email).toBe(registerDto.email);
      console.log('  ✓ User email correct');

      expect(response.body.user.role).toBe('CANDIDATE');
      console.log('  ✓ User role correct');

      console.log('✅ INT-AUTH TEST 1 PASSED\n');
    });

    // ❌ INT-AUTH-2: Register with duplicate email
    it('INT-AUTH-2️⃣ should fail if email already exists', async () => {
      console.log('🧪 INT-AUTH Test 2: Register - duplicate email');

      const uniqueEmail = `existing-${Date.now()}@example.com`; // ✅ UNIQUE

      // Précondition: Créer un utilisateur d'abord
      await prisma.user.create({
        data: {
          email: uniqueEmail,
          password: await bcrypt.hash('Password123!', 10),
          firstName: 'Existing',
          lastName: 'User',
          role: 'CANDIDATE',
          status: 'ACTIVE',
        },
      });

      const registerDto = {
        email: uniqueEmail, // ← Email déjà utilisé
        password: 'NewPassword123!',
        firstName: 'Different',
        lastName: 'Person',
        role: 'CANDIDATE',
      };

      // ACT: Tenter de s'enregistrer avec email existant
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto);

      // ASSERT
      expect(response.status).toBe(400);
      console.log('  ✓ HTTP 400 returned for duplicate email');
      console.log('✅ INT-AUTH TEST 2 PASSED\n');
    });
  });

  // ════════════════════════════════════════════════════
  // INT-AUTH-3: Login workflow
  // ════════════════════════════════════════════════════
  describe('Login', () => {
    it('INT-AUTH-3️⃣ should login successfully and return JWT token', async () => {
      console.log('🧪 INT-AUTH Test 3: Login - success');

      // Précondition: Créer un utilisateur
      const password = 'LoginPassword123!';
      const uniqueEmail = `logintest-${Date.now()}@example.com`; // ✅ UNIQUE

      const testUser = await prisma.user.create({
        data: {
          email: uniqueEmail,
          password: await bcrypt.hash(password, 10),
          firstName: 'Login',
          lastName: 'Test',
          role: 'RECRUITER',
          status: 'ACTIVE',
        },
      });

      const loginDto = {
        email: uniqueEmail,
        password: password,
      };

      // ACT: Envoyer POST login
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto);

      // ASSERT
      expect(response.status).toBe(201);
      console.log('  ✓ HTTP 200 OK');

      expect(response.body).toHaveProperty('access_token');
      console.log('  ✓ Access token returned');

      expect(response.body.user.id).toBe(testUser.id);
      console.log('  ✓ User ID matches');

      console.log('✅ INT-AUTH TEST 3 PASSED\n');
    });

    // ❌ INT-AUTH-4: Login with invalid credentials
    it('INT-AUTH-4️⃣ should fail login with invalid credentials', async () => {
      console.log('🧪 INT-AUTH Test 4: Login - invalid credentials');

      const loginDto = {
        email: `nonexistent-${Date.now()}@example.com`, // ✅ UNIQUE
        password: 'WrongPassword123!',
      };

      // ACT: Tenter login avec credentials invalides
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto);

      // ASSERT
      expect(response.status).toBe(401);
      console.log('  ✓ HTTP 401 returned for invalid credentials');
      console.log('✅ INT-AUTH TEST 4 PASSED\n');
    });
  });

  // ════════════════════════════════════════════════════
  // INT-AUTH-5: Protected route with JWT
  // ════════════════════════════════════════════════════
  describe('Protected Routes', () => {
    it('INT-AUTH-5️⃣ should access protected route with valid JWT token', async () => {
      console.log('🧪 INT-AUTH Test 5: Protected route with JWT');

      // Précondition: Créer utilisateur et login
      const password = 'TestPassword123!';
      const uniqueEmail = `protectedtest-${Date.now()}@example.com`; // ✅ UNIQUE

      const testUser = await prisma.user.create({
        data: {
          email: uniqueEmail,
          password: await bcrypt.hash(password, 10),
          firstName: 'Protected',
          lastName: 'Test',
          role: 'CANDIDATE',
          status: 'ACTIVE',
        },
      });

      // Obtenir le token via login
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: uniqueEmail,
          password: password,
        });

      const token = loginResponse.body.access_token;
      console.log('  ✓ Got JWT token from login');

      // ACT: Accéder une route protégée avec le token
      const response = await request(app.getHttpServer())
        .get('/users/me') // ← Route protégée existante
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      console.log('  ✓ Protected route accessed with valid token');

      // ACT: Tenter sans token
      const noTokenResponse = await request(app.getHttpServer())
        .get('/users/me');

      expect(noTokenResponse.status).toBe(401);
      console.log('  ✓ Protected route returns 401 without token');

      console.log('✅ INT-AUTH TEST 5 PASSED\n');
    });
  });
});
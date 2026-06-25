import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { UsersService } from '../users/users.service';

describe('AuthService - FIXED TEST SUITE', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let emailService: EmailService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            create: jest.fn(),
            comparePasswords: jest.fn(),
            updateLastLogin: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: EmailService,
          useValue: {
            sendWelcomeEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    usersService = module.get<UsersService>(UsersService);
  });

  // ════════════════════════════════════════════════════
  // REGISTER TESTS (4 tests)
  // ════════════════════════════════════════════════════
  describe('Register', () => {
    // ✅ TEST 1: REGISTER RÉUSSI
    it('TEST 1️⃣ should register a new user successfully', async () => {
      console.log('🧪 AUTH Test 1: Register - success');

      const registerDto: any = {
        email: 'john@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CANDIDATE',
      };

      // Mock: Email n'existe pas encore
      jest.spyOn(usersService, 'findByEmail')
        .mockResolvedValue(null);

      // Mock: Créer l'utilisateur
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      const createdUser = {
        id: 1,
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: null,
        role: registerDto.role,
        status: 'ACTIVE',
        refreshToken: null,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(usersService, 'create')
        .mockResolvedValue(createdUser as any);

      // JWT token simulé
      jest.spyOn(jwtService, 'sign')
        .mockReturnValue('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

      // ACT
      const result = await service.register(registerDto);

      // ASSERT
      expect(result).toHaveProperty('access_token');
      console.log('  ✓ Access token retourné');

      expect(result.user.email).toBe(registerDto.email);
      console.log('  ✓ User créé avec bon email');

      expect(result.user.role).toBe('CANDIDATE');
      console.log('  ✓ Role CANDIDATE assigné');

      expect(usersService.create).toHaveBeenCalled();
      console.log('  ✓ User created in database');

      console.log('✅ TEST 1 PASSED\n');
    });

    // ❌ TEST 2: EMAIL DÉJÀ UTILISÉ
    it('TEST 2️⃣ should throw error if email already exists', async () => {
      console.log('🧪 AUTH Test 2: Register - email exists');

      const registerDto: any = {
        email: 'john@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CANDIDATE',
      };

      // Mock: Email existe déjà
      jest.spyOn(usersService, 'findByEmail')
        .mockResolvedValue({
          id: 999,
          email: registerDto.email,
          firstName: 'Existing',
          lastName: 'User',
        } as any);

      // ACT & ASSERT
      await expect(
        service.register(registerDto)
      ).rejects.toThrow('User already exists');

      console.log('  ✓ Correct error thrown: User already exists');
      console.log('✅ TEST 2 PASSED\n');
    });

    // ❌ TEST 3: PASSWORD TROP FAIBLE
    it('TEST 3️⃣ should throw error if password is too weak', async () => {
      console.log('🧪 AUTH Test 3: Register - weak password');

      const registerDto: any = {
        email: 'john@example.com',
        password: '123', // ❌ Trop faible
        firstName: 'John',
        lastName: 'Doe',
        role: 'CANDIDATE',
      };

      // ACT & ASSERT - Password validation should fail
      await expect(
        service.register(registerDto)
      ).rejects.toThrow();

      console.log('  ✓ Password validation error thrown');
      console.log('✅ TEST 3 PASSED\n');
    });

    // ❌ TEST 4: EMAIL INVALIDE
    it('TEST 4️⃣ should throw error if email is invalid', async () => {
      console.log('🧪 AUTH Test 4: Register - invalid email');

      const registerDto: any = {
        email: 'not-an-email', // ❌ Invalide
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CANDIDATE',
      };

      // ACT & ASSERT
      await expect(
        service.register(registerDto)
      ).rejects.toThrow();

      console.log('  ✓ Email validation error thrown');
      console.log('✅ TEST 4 PASSED\n');
    });
  });

  // ════════════════════════════════════════════════════
  // LOGIN TESTS (4 tests)
  // ════════════════════════════════════════════════════
  describe('Login', () => {
    // ✅ TEST 5: LOGIN RÉUSSI
    it('TEST 5️⃣ should login successfully with correct credentials', async () => {
      console.log('🧪 AUTH Test 5: Login - success');

      const loginDto = {
        email: 'john@example.com',
        password: 'SecurePassword123!',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const mockUser = {
        id: 1,
        email: loginDto.email,
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'CANDIDATE',
        status: 'ACTIVE',
      };

      // Mock: User existe
      jest.spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);

      // Mock: Password match
      jest.spyOn(usersService, 'comparePasswords')
        .mockResolvedValue(true);

      // Mock: JWT token
      jest.spyOn(jwtService, 'sign')
        .mockReturnValue('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

      // ACT
      const result = await service.login(loginDto);

      // ASSERT
      expect(result).toHaveProperty('access_token');
      console.log('  ✓ Access token retourné');

      expect(result.user.id).toBe(1);
      console.log('  ✓ User retourné avec bon ID');

      expect(result.user.email).toBe(loginDto.email);
      console.log('  ✓ Email correct');

      expect(usersService.updateLastLogin).toHaveBeenCalledWith(1);
      console.log('  ✓ Last login updated');

      console.log('✅ TEST 5 PASSED\n');
    });

    // ❌ TEST 6: EMAIL N'EXISTE PAS
    it('TEST 6️⃣ should throw error if user not found', async () => {
      console.log('🧪 AUTH Test 6: Login - user not found');

      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'AnyPassword123!',
      };

      // Mock: User n'existe pas
      jest.spyOn(usersService, 'findByEmail')
        .mockResolvedValue(null);

      // ACT & ASSERT
      await expect(
        service.login(loginDto)
      ).rejects.toThrow('Invalid credentials');

      console.log('  ✓ Correct error thrown: Invalid credentials');
      console.log('✅ TEST 6 PASSED\n');
    });

    // ❌ TEST 7: PASSWORD INCORRECT
    it('TEST 7️⃣ should throw error if password is incorrect', async () => {
      console.log('🧪 AUTH Test 7: Login - wrong password');

      const loginDto = {
        email: 'john@example.com',
        password: 'WrongPassword123!',
      };

      const mockUser = {
        id: 1,
        email: loginDto.email,
        password: 'hashedCorrectPassword...',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CANDIDATE',
        status: 'ACTIVE',
      };

      // Mock: User existe
      jest.spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);

      // Mock: Password NO match
      jest.spyOn(usersService, 'comparePasswords')
        .mockResolvedValue(false);

      // ACT & ASSERT
      await expect(
        service.login(loginDto)
      ).rejects.toThrow('Invalid credentials');

      console.log('  ✓ Correct error thrown: Invalid credentials');
      console.log('✅ TEST 7 PASSED\n');
    });

    // ❌ TEST 8: USER INACTIF - FIXED ERROR MESSAGE
    it('TEST 8️⃣ should throw error if user account is inactive', async () => {
      console.log('🧪 AUTH Test 8: Login - inactive account');

      const loginDto = {
        email: 'john@example.com',
        password: 'SecurePassword123!',
      };

      const hashedPassword = await bcrypt.hash(loginDto.password, 10);
      const mockUser = {
        id: 1,
        email: loginDto.email,
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'CANDIDATE',
        status: 'INACTIVE', // ❌ Inactif
      };

      // Mock: User existe
      jest.spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);

      // Mock: Password match
      jest.spyOn(usersService, 'comparePasswords')
        .mockResolvedValue(true);

      // ACT & ASSERT - Match the actual error message from auth.service.ts
      await expect(
        service.login(loginDto)
      ).rejects.toThrow('Account is not active');

      console.log('  ✓ Correct error thrown: Account not active');
      console.log('✅ TEST 8 PASSED\n');
    });
  });
});
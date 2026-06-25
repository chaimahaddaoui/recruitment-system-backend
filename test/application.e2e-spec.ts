import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { describe, it } from 'node:test';

describe('Application API (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'candidate@test.com',
        password: 'candidate123',
      });

    token = login.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create application', async () => {
    await request(app.getHttpServer())
      .post('/applications')/*  */
      .set('Authorization', `Bearer ${token}`)
      .field('jobId', '1')
      .field('coverLetter', 'Motivation')
      .attach('cv', 'test/fixtures/test-cv.pdf')
      .expect(201);
  });
});

function beforeAll(arg0: () => Promise<void>) {
    throw new Error('Function not implemented.');
}
function afterAll(arg0: () => Promise<void>) {
    throw new Error('Function not implemented.');
}


/* import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import * as fs from 'fs';

interface HealthCheckResponse {
  status: string;
  models_loaded?: boolean;
  extractor?: string;
  matcher?: string;
  version?: string;
}

interface AiMatchingResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

interface AnalyzeAndMatchResponse {
  success: boolean;
  extracted_data?: any;
  matching_result?: any;
  error?: string;
  message?: string;
}

@Injectable()
export class DjangoAiService {
  analyzeAndMatchCvFile(arg0: { cvFilePath: string; jobDescription: string; jobSkills: any; requiredExperience: any; }) {
    throw new Error('Method not implemented.');
  }
  private readonly logger = new Logger(DjangoAiService.name);
  private readonly djangoUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.djangoUrl =
      this.configService.get<string>('DJANGO_AI_URL') ||
      'http://localhost:8000/api';

    this.logger.log(`Django AI Service initialized: ${this.djangoUrl}`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get<HealthCheckResponse>(
        `${this.djangoUrl}/health/`,
        {
          timeout: 5000,
        },
      );

      this.logger.log('Django AI backend is healthy');

      return response.data.status === 'healthy';
    } catch (error: any) {
      this.logger.error(
        `Django AI backend unreachable: ${error.message}`,
      );

      return false;
    }
  }

  async matchCvWithJob(params: {
    cvText: string;
    jobDescription: string;
    cvSkills?: string[];
    jobSkills?: string[];
    cvExperience?: number;
    requiredExperience?: number;
  }): Promise<any> {
    try {
      this.logger.log('Calling Django AI for CV matching...');

      const response = await axios.post<AiMatchingResponse>(
        `${this.djangoUrl}/match-cv-job/`,
        {
          cv_text: params.cvText,
          job_description: params.jobDescription,
          cv_skills: params.cvSkills || [],
          job_skills: params.jobSkills || [],
          cv_experience: params.cvExperience || 0,
          required_experience: params.requiredExperience || 0,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      if (response.data.success && response.data.data) {
        this.logger.log(
          `AI Matching successful: Score ${response.data.data.final_score}/100`,
        );

        return response.data.data;
      }

      throw new Error(response.data.error || 'AI matching failed');
    } catch (error: any) {
      this.logger.error(`Error calling Django AI: ${error.message}`);

      return {
        final_score: 0,
        recommendation: 'NON ÉVALUÉ',
        breakdown: {},
        skills_analysis: {},
        details: {},
        error: error.message,
      };
    }
  }

  async analyzeAndMatch(params: {
    cvPath: string;
    jobDescription: string;
    jobSkills?: string[];
    requiredExperience?: number;
  }): Promise<any> {
    try {
      this.logger.log('Calling Django AI for CV analysis and matching...');

      if (!params.cvPath) {
        throw new Error('Chemin du CV introuvable');
      }

      if (!fs.existsSync(params.cvPath)) {
        throw new Error(`Fichier CV introuvable: ${params.cvPath}`);
      }

      const formData = new FormData();

      formData.append('cv_file', fs.createReadStream(params.cvPath));
      formData.append('job_description', params.jobDescription);

      if (params.jobSkills && params.jobSkills.length > 0) {
        formData.append('job_skills', JSON.stringify(params.jobSkills));
      }

      if (params.requiredExperience !== undefined) {
        formData.append(
          'required_experience',
          String(params.requiredExperience),
        );
      }

      const response = await axios.post<AnalyzeAndMatchResponse>(
        `${this.djangoUrl}/analyze-and-match/`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 60000,
        } as any,
      );

      if (response.data.success) {
        this.logger.log('AI analysis and matching successful');

        return {
          extractedData: response.data.extracted_data,
          matchingResult: response.data.matching_result,
          message: response.data.message,
        };
      }

      throw new Error(response.data.error || 'AI analysis failed');
    } catch (error: any) {
      this.logger.error(
        `Error calling Django AI analyze-and-match: ${error.message}`,
      );

      return {
        extractedData: null,
        matchingResult: {
          final_score: 0,
          recommendation: 'NON ÉVALUÉ',
          breakdown: {},
          skills_analysis: {},
          details: {},
        },
        error: error.message,
      };
    }
  }

  async analyzeCv(cvPath: string): Promise<any> {
    try {
      this.logger.log('Calling Django AI for CV analysis...');

      if (!cvPath) {
        throw new Error('Chemin du CV introuvable');
      }

      if (!fs.existsSync(cvPath)) {
        throw new Error(`Fichier CV introuvable: ${cvPath}`);
      }

      const formData = new FormData();
      formData.append('cv_file', fs.createReadStream(cvPath));

      const response = await axios.post<AiMatchingResponse>(
        `${this.djangoUrl}/analyze-cv/`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 60000,
        } as any,
      );

      if (response.data.success && response.data.data) {
        this.logger.log('CV analysis successful');
        return response.data.data;
      }

      throw new Error(response.data.error || 'CV analysis failed');
    } catch (error: any) {
      this.logger.error(`Error analyzing CV: ${error.message}`);

      return {
        email: null,
        phone: null,
        skills: [],
        experience_years: 0,
        education_level: 'UNKNOWN',
        error: error.message,
      };
    }
  }
} */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';

// ✅ Important : ne pas utiliser import FormData from 'form-data'
const FormData = require('form-data');

interface HealthCheckResponse {
  status: string;
  models_loaded?: boolean;
  extractor?: string;
  matcher?: string;
  version?: string;
}

interface AiMatchingResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

interface AnalyzeAndMatchResponse {
  success: boolean;
  extracted_data?: any;
  matching_result?: any;
  error?: string;
  message?: string;
}

@Injectable()
export class DjangoAiService {
  private readonly logger = new Logger(DjangoAiService.name);
  private readonly djangoUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.djangoUrl =
      this.configService.get<string>('DJANGO_AI_URL') ||
      'http://localhost:8000/api';

    this.logger.log(`Django AI Service initialized: ${this.djangoUrl}`);
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get<HealthCheckResponse>(
        `${this.djangoUrl}/health/`,
        {
          timeout: 5000,
        },
      );

      this.logger.log('Django AI backend is healthy');
      return response.data.status === 'healthy';
    } catch (error: any) {
      this.logger.error(`Django AI backend unreachable: ${error.message}`);
      return false;
    }
  }

  async matchCvWithJob(params: {
    cvText: string;
    jobDescription: string;
    cvSkills?: string[];
    jobSkills?: string[];
    cvExperience?: number;
    requiredExperience?: number;
  }): Promise<any> {
    try {
      this.logger.log('Calling Django AI for CV matching...');

      const response = await axios.post<AiMatchingResponse>(
        `${this.djangoUrl}/match-cv-job/`,
        {
          cv_text: params.cvText,
          job_description: params.jobDescription,
          cv_skills: params.cvSkills || [],
          job_skills: params.jobSkills || [],
          cv_experience: params.cvExperience || 0,
          required_experience: params.requiredExperience || 0,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      if (response.data.success && response.data.data) {
        this.logger.log(
          `AI Matching successful: Score ${response.data.data.final_score}/100`,
        );
        return response.data.data;
      }

      throw new Error(response.data.error || 'AI matching failed');
    } catch (error: any) {
      this.logger.error(`Error calling Django AI: ${error.message}`);

      return {
        final_score: 0,
        recommendation: 'NON ÉVALUÉ',
        breakdown: {},
        skills_analysis: {},
        details: {},
        error: error.message,
      };
    }
  }

  async analyzeAndMatch(params: {
    cvPath: string;
    jobDescription: string;
    jobSkills?: string[];
    requiredExperience?: number;
  }): Promise<any> {
    try {
      this.logger.log('Calling Django AI for CV analysis and matching...');

      if (!params.cvPath) {
        throw new Error('Chemin du CV introuvable');
      }

      if (!fs.existsSync(params.cvPath)) {
        throw new Error(`Fichier CV introuvable: ${params.cvPath}`);
      }

      const formData = new FormData();

      formData.append('cv_file', fs.createReadStream(params.cvPath));
      formData.append('job_description', params.jobDescription);

      if (params.jobSkills && params.jobSkills.length > 0) {
        formData.append('job_skills', JSON.stringify(params.jobSkills));
      }

      if (params.requiredExperience !== undefined) {
        formData.append(
          'required_experience',
          String(params.requiredExperience),
        );
      }

      const response = await axios.post<AnalyzeAndMatchResponse>(
        `${this.djangoUrl}/analyze-and-match/`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 60000,
        } as any,
      );

      if (response.data.success) {
        this.logger.log('AI analysis and matching successful');

        return {
          extractedData: response.data.extracted_data,
          matchingResult: response.data.matching_result,
          message: response.data.message,
        };
      }

      throw new Error(response.data.error || 'AI analysis failed');
    } catch (error: any) {
      this.logger.error(
        `Error calling Django AI analyze-and-match: ${error.message}`,
      );

      return {
        extractedData: null,
        matchingResult: {
          final_score: 0,
          recommendation: 'NON ÉVALUÉ',
          breakdown: {},
          skills_analysis: {},
          details: {},
        },
        error: error.message,
      };
    }
  }

  // ✅ Alias pour ne pas casser ton ancien code
  async analyzeAndMatchCvFile(params: {
    cvPath: string;
    jobDescription: string;
    jobSkills?: string[];
    requiredExperience?: number;
  }): Promise<any> {
    return this.analyzeAndMatch(params);
  }

  async analyzeCv(cvPath: string): Promise<any> {
    try {
      this.logger.log('Calling Django AI for CV analysis...');

      if (!cvPath) {
        throw new Error('Chemin du CV introuvable');
      }

      if (!fs.existsSync(cvPath)) {
        throw new Error(`Fichier CV introuvable: ${cvPath}`);
      }

      const formData = new FormData();

      formData.append('cv_file', fs.createReadStream(cvPath));

      const response = await axios.post<AiMatchingResponse>(
        `${this.djangoUrl}/analyze-cv/`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 60000,
        } as any,
      );

      if (response.data.success && response.data.data) {
        this.logger.log('CV analysis successful');
        return response.data.data;
      }

      throw new Error(response.data.error || 'CV analysis failed');
    } catch (error: any) {
      this.logger.error(`Error analyzing CV: ${error.message}`);

      return {
        email: null,
        phone: null,
        skills: [],
        experience_years: 0,
        education_level: 'UNKNOWN',
        error: error.message,
      };
    }
  }
}
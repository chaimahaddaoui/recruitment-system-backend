import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Counter,
  Gauge,
  Histogram,
  register,
  collectDefaultMetrics,
} from 'prom-client';

/**
 * PrometheusService
 * 
 * Service qui gère toutes les métriques Prometheus
 * 
 * Métriques exposées:
 * - http_requests_total (compteur)
 * - http_request_duration_seconds (histogramme)
 * - active_users (jauge)
 * - applications_created_total (compteur)
 * - jobs_created_total (compteur)
 */
@Injectable()
export class PrometheusService implements OnModuleInit {
  // ════════════════════════════════════════════════════
  // COMPTEURS (Counter) - augmente toujours
  // ════════════════════════════════════════════════════

  private httpRequestsTotal!: Counter;
  private applicationsCreatedTotal!: Counter;
  private jobsCreatedTotal!: Counter;
  private usersRegisteredTotal!: Counter;

  // ════════════════════════════════════════════════════
  // HISTOGRAMME (Histogram) - mesure la durée
  // ════════════════════════════════════════════════════

  private httpRequestDurationSeconds!: Histogram;

  // ════════════════════════════════════════════════════
  // JAUGES (Gauge) - peut augmenter ou diminuer
  // ════════════════════════════════════════════════════

  private activeUsersGauge!: Gauge;
  private pendingApplicationsGauge!: Gauge;

  /**
   * OnModuleInit - Initialiser les métriques au démarrage
   */
  onModuleInit() {
    console.log('📊 Initializing Prometheus metrics...\n');

    // Collecter les métriques par défaut (RAM, CPU, etc.)
    collectDefaultMetrics({ register });

    // ════════════════════════════════════════════════════
    // 1️⃣ COMPTEURS
    // ════════════════════════════════════════════════════

    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code'],
      registers: [register],
    });

    this.applicationsCreatedTotal = new Counter({
      name: 'applications_created_total',
      help: 'Total number of applications created',
      labelNames: ['status'],
      registers: [register],
    });

    this.jobsCreatedTotal = new Counter({
      name: 'jobs_created_total',
      help: 'Total number of jobs created',
      labelNames: ['contract_type'],
      registers: [register],
    });

    this.usersRegisteredTotal = new Counter({
      name: 'users_registered_total',
      help: 'Total number of users registered',
      labelNames: ['role'],
      registers: [register],
    });

    // ════════════════════════════════════════════════════
    // 2️⃣ HISTOGRAMME
    // ════════════════════════════════════════════════════

    this.httpRequestDurationSeconds = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'route', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5], // 100ms, 500ms, 1s, 2s, 5s
      registers: [register],
    });

    // ════════════════════════════════════════════════════
    // 3️⃣ JAUGES
    // ════════════════════════════════════════════════════

    this.activeUsersGauge = new Gauge({
      name: 'active_users',
      help: 'Number of currently active users',
      labelNames: ['role'],
      registers: [register],
    });

    this.pendingApplicationsGauge = new Gauge({
      name: 'pending_applications',
      help: 'Number of pending applications',
      registers: [register],
    });

    console.log('✅ Prometheus metrics initialized\n');
  }

  // ════════════════════════════════════════════════════
  // MÉTHODES PUBLIQUES - Pour enregistrer des métriques
  // ════════════════════════════════════════════════════

  /**
   * Enregistrer une requête HTTP
   * 
   * Usage:
   * this.prometheus.recordHttpRequest('GET', '/jobs', 200, 0.125);
   */
  recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ) {
    this.httpRequestsTotal
      .labels(method, route, statusCode.toString())
      .inc();

    this.httpRequestDurationSeconds
      .labels(method, route, statusCode.toString())
      .observe(durationSeconds);
  }

  /**
   * Enregistrer une application créée
   */
  recordApplicationCreated(status: string = 'success') {
    this.applicationsCreatedTotal.labels(status).inc();
    this.pendingApplicationsGauge.inc();
  }

  /**
   * Enregistrer une application shortlistée
   */
  recordApplicationShortlisted() {
    this.pendingApplicationsGauge.dec();
  }

  /**
   * Enregistrer un job créé
   */
  recordJobCreated(contractType: string = 'CDI') {
    this.jobsCreatedTotal.labels(contractType).inc();
  }

  /**
   * Enregistrer un utilisateur enregistré
   */
  recordUserRegistered(role: string = 'CANDIDATE') {
    this.usersRegisteredTotal.labels(role).inc();
    this.activeUsersGauge.labels(role).inc();
  }

  /**
   * Mise à jour des utilisateurs actifs
   */
  setActiveUsers(role: string, count: number) {
    this.activeUsersGauge.labels(role).set(count);
  }

  /**
   * Mise à jour des applications en attente
   */
  setPendingApplications(count: number) {
    this.pendingApplicationsGauge.set(count);
  }

  /**
   * Obtenir toutes les métriques au format Prometheus
   */
  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  /**
   * Obtenir le content-type pour la réponse
   */
  getContentType(): string {
    return register.contentType;
  }
}
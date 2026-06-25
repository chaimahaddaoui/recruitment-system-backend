import { Module } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';

/**
 * Module Prometheus
 * 
 * Ce module initialise les métriques Prometheus
 * et expose l'endpoint /metrics
 * 
 * Utilisation:
 * - Ajoute PrometheusModule dans AppModule.imports
 * - Inject PrometheusService pour enregistrer des métriques custom
 */
@Module({
  providers: [PrometheusService],
  exports: [PrometheusService],
})
export class PrometheusModule {}
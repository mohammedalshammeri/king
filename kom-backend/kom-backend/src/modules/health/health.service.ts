import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface HealthCheck {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: 'ok' | 'error';
      latency?: number;
      error?: string;
    };
  };
}

@Injectable()
export class HealthService {
  private readonly startTime: number;
  private readonly version: string;

  constructor(private readonly prisma: PrismaService) {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '1.0.0';
  }

  async check(): Promise<HealthCheck> {
    const dbCheck = await this.checkDatabase();

    return {
      status: dbCheck.status === 'ok' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      version: this.version,
      checks: {
        database: dbCheck,
      },
    };
  }

  private async checkDatabase(): Promise<{
    status: 'ok' | 'error';
    latency?: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown database error',
      };
    }
  }

  async liveness(): Promise<{ status: 'ok' }> {
    return { status: 'ok' };
  }

  ping(): { status: 'ok'; ts: string } {
    return { status: 'ok', ts: new Date().toISOString() };
  }

  async readiness(): Promise<{ status: 'ok' | 'error'; database: boolean }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: true };
    } catch {
      return { status: 'error', database: false };
    }
  }
}

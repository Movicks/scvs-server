import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

function getDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL || 'mongodb://localhost:27017/scvs'
  try {
    const u = new URL(raw)
    if (!u.pathname || u.pathname === '/' || u.pathname === '') {
      u.pathname = '/scvs'
    }
    return u.toString()
  } catch {
    // Fallback if URL parsing fails
    if (/^mongodb(\+srv)?:\/\//.test(raw)) {
      return raw.includes('/') ? raw : `${raw}/scvs`
    }
    return raw
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const url = getDatabaseUrl()
    super({
      // Cast to any to align with generated client runtime expectation in Prisma v7
      datasources: {
        db: { url },
      },
    } as any)
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}
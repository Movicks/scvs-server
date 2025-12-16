import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(entry: {
    actorId?: string
    action: string
    entityType: string
    entityId?: string
    ipAddress?: string
    userAgent?: string
  }) {
    await this.prisma.auditLog.create({ data: { ...entry } })
  }
}
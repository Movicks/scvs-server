import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async create(dto: { institutionId: string; fullName: string; matricNumber: string }, actorId?: string) {
    const student = await this.prisma.student.create({
      data: {
        institutionId: dto.institutionId,
        fullName: dto.fullName,
        matricNumber: dto.matricNumber,
      },
    })
    await this.audit.log({ action: 'STUDENT_CREATE', entityType: 'Student', entityId: student.id, actorId })
    return student
  }

  async list(institutionId: string) {
    return this.prisma.student.findMany({ where: { institutionId } })
  }
}
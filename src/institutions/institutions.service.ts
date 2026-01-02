import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'

@Injectable()
export class InstitutionsService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async approve(id: string) {
    const inst = await this.prisma.institution.update({ where: { id }, data: { status: 'APPROVED' } })
    await this.audit.log({ action: 'INSTITUTION_APPROVE', entityType: 'Institution', entityId: id })
    return inst
  }

  async suspend(id: string) {
    const inst = await this.prisma.institution.update({ where: { id }, data: { status: 'SUSPENDED' } })
    await this.audit.log({ action: 'INSTITUTION_SUSPEND', entityType: 'Institution', entityId: id })
    return inst
  }
}
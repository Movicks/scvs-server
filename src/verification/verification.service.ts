import { Injectable, NotFoundException, Inject } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CryptoService } from '../crypto/crypto.service'
import { CertificateStatus, InstitutionStatus } from '@prisma/client'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import type { Cache } from 'cache-manager'

@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) {}

  async verifyCertificateNumber(certificateNumber: string) {
    const cacheKey = `verify:${certificateNumber}`
    const cached = await this.cache.get(cacheKey)
    if (cached) return cached

    const cert = await this.prisma.certificate.findUnique({ where: { certificateNumber } })
    if (!cert) throw new NotFoundException('Certificate not found')

    const institution = await this.prisma.institution.findUnique({ where: { id: cert.institutionId } })
    if (!institution || institution.status !== InstitutionStatus.APPROVED) {
      throw new NotFoundException('Certificate invalid')
    }

    const canonical = JSON.stringify({
      institutionId: cert.institutionId,
      studentId: cert.studentId,
      certificateNumber: cert.certificateNumber,
      metadata: cert.metadata,
    })
    const hash = await this.crypto.sha256(canonical)
    const signatureValid = await this.crypto.verify(canonical, cert.signature)

    const response = {
      certificateId: cert.id,
      certificateNumber: cert.certificateNumber,
      status: cert.status,
      valid: cert.status === CertificateStatus.VALID && hash === cert.hash && signatureValid,
      metadata: cert.metadata,
      issuedAt: cert.issuedAt,
      institution: {
        id: institution.id,
        name: institution.name,
        accreditationId: institution.accreditationId,
        status: institution.status,
      },
    }

    await this.cache.set(cacheKey, response, 60)
    await this.prisma.auditLog.create({
      data: {
        action: 'CERTIFICATE_VERIFY',
        entityType: 'Certificate',
        entityId: cert.id,
      },
    })
    return response
  }
}
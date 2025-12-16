import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { AuditService } from '../audit/audit.service'
import { CryptoService } from '../crypto/crypto.service'
import { CertificateStatus, InstitutionStatus } from '@prisma/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import * as QRCode from 'qrcode'

export interface IssueCertificateDto {
  institutionId: string
  studentId: string
  certificateNumber: string
  metadata: Record<string, any>
  pdfBase64?: string
}

@Injectable()
export class CertificatesService {
  private s3 = new S3Client({
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  })

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly crypto: CryptoService,
  ) {}

  async issue(dto: IssueCertificateDto, actorId?: string) {
    const institution = await this.prisma.institution.findUnique({ where: { id: dto.institutionId } })
    if (!institution) throw new BadRequestException('Invalid institution')
    if (institution.status !== InstitutionStatus.APPROVED) throw new ForbiddenException('Institution not approved')

    const canonical = JSON.stringify({
      institutionId: dto.institutionId,
      studentId: dto.studentId,
      certificateNumber: dto.certificateNumber,
      metadata: dto.metadata,
    })
    const hash = await this.crypto.sha256(canonical)
    const signature = await this.crypto.sign(canonical)

    const verifyUrl = `${process.env.BASE_URL}/verify/${dto.certificateNumber}`
    const qrSvg = await QRCode.toString(verifyUrl, { type: 'svg' })

    const cert = await this.prisma.certificate.create({
      data: {
        certificateNumber: dto.certificateNumber,
        institutionId: dto.institutionId,
        studentId: dto.studentId,
        metadata: dto.metadata as any,
        hash,
        signature,
        status: CertificateStatus.VALID,
      },
    })

    // Upload QR as asset (SVG)
    const qrKey = `certificates/${cert.id}/qr.svg`
    await this.s3.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!,
        Key: qrKey,
        Body: Buffer.from(qrSvg),
        ContentType: 'image/svg+xml',
      }),
    )

    // Optionally upload PDF
    if (dto.pdfBase64) {
      const pdfKey = `certificates/${cert.id}/certificate.pdf`
      const pdfBuf = Buffer.from(dto.pdfBase64, 'base64')
      await this.s3.send(
        new PutObjectCommand({
          Bucket: process.env.S3_BUCKET!,
          Key: pdfKey,
          Body: pdfBuf,
          ContentType: 'application/pdf',
        }),
      )
      await this.prisma.certificate.update({
        where: { id: cert.id },
        data: { pdfUrl: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${pdfKey}` },
      })
    }

    await this.audit.log({
      action: 'CERTIFICATE_ISSUE',
      entityType: 'Certificate',
      entityId: cert.id,
      actorId,
    })

    return cert
  }

  async bulkIssue(dtos: IssueCertificateDto[], actorId?: string) {
    const results: any[] = []
    for (const dto of dtos) {
      results.push(await this.issue(dto, actorId))
    }
    return results
  }

  async getOne(id: string) {
    return this.prisma.certificate.findUnique({ where: { id } })
  }

  async revoke(id: string, actorId?: string) {
    const cert = await this.prisma.certificate.update({
      where: { id },
      data: { status: CertificateStatus.REVOKED, revokedAt: new Date() },
    })
    await this.audit.log({
      action: 'CERTIFICATE_REVOKE',
      entityType: 'Certificate',
      entityId: id,
      actorId,
    })
    return cert
  }
}
import { ApiProperty } from '@nestjs/swagger'

// Use string unions in DTO since Prisma enums are not exported as TS enums in the client
type InstitutionStatus = 'PENDING' | 'APPROVED' | 'SUSPENDED'
type CertificateStatus = 'VALID' | 'REVOKED' | 'EXPIRED'

export class InstitutionSummaryDto {
  @ApiProperty({ description: 'Institution unique identifier', example: '664f6f2a9f6e3a00123abcd1' })
  id: string

  @ApiProperty({ description: 'Institution name', example: 'Springfield University' })
  name: string

  @ApiProperty({ description: 'Accreditation identifier', example: 'NUC-UNI-2024-0001' })
  accreditationId: string

  @ApiProperty({ description: 'Institution approval status', enum: ['PENDING', 'APPROVED', 'SUSPENDED'], enumName: 'InstitutionStatus', example: 'APPROVED' })
  status: InstitutionStatus
}

export class VerifyResponseDto {
  @ApiProperty({ description: 'Certificate unique identifier', example: '66507fa0b9f0da0012cdef34' })
  certificateId: string

  @ApiProperty({ description: 'Public certificate number used for verification', example: 'SCVS-2024-UNIV-000001' })
  certificateNumber: string

  @ApiProperty({ description: 'Certificate issuance status', enum: ['VALID', 'REVOKED', 'EXPIRED'], enumName: 'CertificateStatus', example: 'VALID' })
  status: CertificateStatus

  @ApiProperty({ description: 'Whether the certificate is cryptographically valid', example: true })
  valid: boolean

  @ApiProperty({ description: 'Certificate metadata as key-value pairs', type: 'object', additionalProperties: true, example: { program: 'BSc Computer Science', graduationYear: 2024 } })
  metadata: Record<string, any>

  @ApiProperty({ description: 'Date the certificate was issued', example: '2024-06-01T10:15:00.000Z' })
  issuedAt: Date

  @ApiProperty({ description: 'Issuing institution summary', type: InstitutionSummaryDto })
  institution: InstitutionSummaryDto
}
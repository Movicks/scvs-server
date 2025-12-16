import { Module } from '@nestjs/common'
import { CertificatesService } from './certificates.service'
import { CertificatesController } from './certificates.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { AuditModule } from '../audit/audit.module'
import { CryptoModule } from '../crypto/crypto.module'

@Module({
  imports: [PrismaModule, AuditModule, CryptoModule],
  controllers: [CertificatesController],
  providers: [CertificatesService],
})
export class CertificatesModule {}
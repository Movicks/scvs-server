import { Module } from '@nestjs/common'
import { VerificationController } from './verification.controller'
import { VerificationService } from './verification.service'
import { PrismaModule } from '../prisma/prisma.module'
import { CryptoModule } from '../crypto/crypto.module'

@Module({
  imports: [PrismaModule, CryptoModule],
  controllers: [VerificationController],
  providers: [VerificationService],
})
export class VerificationModule {}
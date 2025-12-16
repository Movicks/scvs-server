import { Module } from '@nestjs/common'
import { InstitutionsService } from './institutions.service'
import { InstitutionsController } from './institutions.controller'
import { PrismaModule } from '../prisma/prisma.module'
import { AuditModule } from '../audit/audit.module'

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [InstitutionsController],
  providers: [InstitutionsService],
})
export class InstitutionsModule {}
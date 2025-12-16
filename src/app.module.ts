import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { LoggerModule } from 'nestjs-pino'
import { AuthModule } from './auth/auth.module'
import { PrismaModule } from './prisma/prisma.module'
import { CacheModule } from '@nestjs/cache-manager'
import { redisStore } from 'cache-manager-redis-yet'
import { CertificatesModule } from './certificates/certificates.module'
import { VerificationModule } from './verification/verification.module'
import { InstitutionsModule } from './institutions/institutions.module'
import { StudentsModule } from './students/students.module'
import { APP_GUARD } from '@nestjs/core'
import { RolesGuard } from './common/guards/roles.guard'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { ttl: 60, limit: 100 },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        customProps: () => ({ context: 'HTTP' }),
      },
    }),
    PrismaModule,
    AuthModule,
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL,
          ttl: 60,
        }),
      }),
    }),
    CertificatesModule,
    VerificationModule,
    InstitutionsModule,
    StudentsModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

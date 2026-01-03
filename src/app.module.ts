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
// Remove APP_GUARD RolesGuard registration
// import { APP_GUARD } from '@nestjs/core'
// import { RolesGuard } from './common/guards/roles.guard'

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
      useFactory: async () => {
        const url = process.env.REDIS_URL
        if (url && url.trim() !== '') {
          return {
            store: await redisStore({ url, ttl: 60 }),
          }
        }
        // Fallback to in-memory cache when REDIS_URL is not provided
        return { ttl: 60 }
      },
    }),
    CertificatesModule,
    VerificationModule,
    InstitutionsModule,
    StudentsModule,
  ],
  providers: [
    // Removed global RolesGuard provider
    // { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

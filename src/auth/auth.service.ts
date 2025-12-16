import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { AuditService } from '../audit/audit.service'
import * as argon2 from 'argon2'
import { Role, UserStatus } from '@prisma/client'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async signup(dto: { email: string; password: string; institutionName: string; accreditationId: string; role: 'INSTITUTION_ADMIN' }, req: any) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new BadRequestException('Email already registered')

    const inst = await this.prisma.institution.create({
      data: {
        name: dto.institutionName,
        accreditationId: dto.accreditationId,
        status: 'PENDING',
      },
    })

    const passwordHash = await argon2.hash(dto.password)
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: 'INSTITUTION_ADMIN' as Role,
        status: 'ACTIVE' as UserStatus,
      },
    })

    await this.audit.log({ action: 'USER_SIGNUP', entityType: 'User', entityId: user.id, actorId: user.id })

    return { id: user.id, email: user.email, institutionId: inst.id }
  }

  async login(dto: { email: string; password: string }, req: any) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')
    const ok = await argon2.verify(user.passwordHash, dto.password)
    if (!ok) throw new UnauthorizedException('Invalid credentials')

    const payload = { sub: user.id, role: user.role }
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: '15m',
    })
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: '7d',
    })
    const refreshTokenHash = await argon2.hash(refreshToken)
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash } })

    await this.audit.log({ action: 'USER_LOGIN', entityType: 'User', entityId: user.id, actorId: user.id })
    return { accessToken, refreshToken }
  }

  async refresh(userPayload: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userPayload.sub } })
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException()

    const payload = { sub: user.id, role: user.role }
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: '15m',
    })
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: '7d',
    })
    const refreshTokenHash = await argon2.hash(refreshToken)
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash } })

    await this.audit.log({ action: 'USER_REFRESH', entityType: 'User', entityId: user.id, actorId: user.id })
    return { accessToken, refreshToken }
  }

  async logout(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } })
    if (!user) return { success: true }
    await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } })
    await this.audit.log({ action: 'USER_LOGOUT', entityType: 'User', entityId: user.id, actorId: user.id })
    return { success: true }
  }
}
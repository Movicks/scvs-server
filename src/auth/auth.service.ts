import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { JwtService } from '@nestjs/jwt'
import { AuditService } from '../audit/audit.service'
import * as argon2 from 'argon2'
import { UserStatus, Role, Prisma } from '@prisma/client'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  // Helper to set cookies for access and refresh tokens
  private async setSessionCookies(res: any, payload: { sub: string }) {
    const accessToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: '15m',
    })
    const refreshToken = await this.jwt.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET!,
      expiresIn: '7d',
    })
    const isProd = process.env.NODE_ENV === 'production'
    // Set httpOnly cookies
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 15 * 60 * 1000,
    })
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    // Persist server-side hash of refresh token
    const refreshTokenHash = await argon2.hash(refreshToken)
    await this.prisma.user.update({ where: { id: payload.sub }, data: { refreshTokenHash } })
  }

  private normalizeUser(user: any, institution?: any) {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? user.email.split('@')[0],
      institutionId: user.institutionId ?? institution?.id,
      institution: institution
        ? {
            id: institution.id,
            name: institution.name,
            email: institution.email ?? '',
            website: institution.website ?? '',
            address: institution.address ?? '',
            phone: institution.phone ?? '',
            status: institution.status,
            approvedAt: institution.approvedAt ?? null,
            createdAt: institution.createdAt,
          }
        : undefined,
      photoUrl: user.photoUrl ?? undefined,
      createdAt: user.createdAt,
      // role intentionally omitted from response
    }
  }

  async signup(dto: { email: string; password: string; institutionName: string; accreditationId: string }, req: any) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new BadRequestException('Email already registered')

    let inst: any
    try {
      inst = await this.prisma.institution.create({
        data: {
          name: dto.institutionName,
          accreditationId: dto.accreditationId,
          status: 'PENDING',
        },
      })
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        const target = Array.isArray((e as any)?.meta?.target) ? (e as any).meta.target.join(',') : (e as any)?.meta?.target
        if (typeof target === 'string') {
          if (target.includes('accreditationId')) {
            throw new BadRequestException('Institution with this accreditationId already exists')
          }
          if (target.includes('name')) {
            throw new BadRequestException('Institution name already exists')
          }
        }
        throw new BadRequestException('Institution already exists')
      }
      throw e
    }

    const passwordHash = await argon2.hash(dto.password)
    let user: any
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: Role.INSTITUTION_ADMIN,
          status: 'ACTIVE' as UserStatus,
          institutionId: inst.id,
        },
      })
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('Email already registered')
      }
      throw e
    }

    await this.audit.log({ action: 'USER_SIGNUP', entityType: 'User', entityId: user.id, actorId: user.id })

    // Establish session
    const res = req?.res
    if (res) {
      await this.setSessionCookies(res, { sub: user.id })
    }

    return this.normalizeUser(user, inst)
  }

  async login(dto: { email: string; password: string }, req: any) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')
    const ok = await argon2.verify(user.passwordHash, dto.password)
    if (!ok) throw new UnauthorizedException('Invalid credentials')

    const res = req?.res
    if (res) {
      await this.setSessionCookies(res, { sub: user.id })
    }

    const institution = user.institutionId
      ? await this.prisma.institution.findUnique({ where: { id: user.institutionId } })
      : undefined

    await this.audit.log({ action: 'USER_LOGIN', entityType: 'User', entityId: user.id, actorId: user.id })
    return this.normalizeUser(user, institution)
  }

  async refresh(userPayload: any, req?: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userPayload.sub } })
    if (!user || !user.refreshTokenHash) throw new UnauthorizedException()

    // Rotate tokens
    const res = req?.res
    if (res) {
      await this.setSessionCookies(res, { sub: user.id })
    }

    await this.audit.log({ action: 'USER_REFRESH', entityType: 'User', entityId: user.id, actorId: user.id })
    // Do not return tokens; session is maintained via cookies
    return { success: true } as any
  }

  async logout(email?: string, req?: any) {
    // If an email is provided, invalidate server-side refresh token state; otherwise skip
    if (email) {
      try {
        const user = await this.prisma.user.findUnique({ where: { email } })
        if (user) {
          await this.prisma.user.update({ where: { id: user.id }, data: { refreshTokenHash: null } })
          await this.audit.log({ action: 'USER_LOGOUT', entityType: 'User', entityId: user.id, actorId: user.id })
        }
      } catch (_) {
        // Swallow errors from optional email processing to ensure cookies are cleared below
      }
    }
    const res = req?.res
    if (res) {
      const isProd = process.env.NODE_ENV === 'production'
      res.clearCookie('access_token', { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/' })
      res.clearCookie('refresh_token', { httpOnly: true, sameSite: 'lax', secure: isProd, path: '/' })
    }
    return { success: true }
  }

  async me(userPayload: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userPayload.sub } })
    if (!user) throw new UnauthorizedException()
    const institution = user.institutionId
      ? await this.prisma.institution.findUnique({ where: { id: user.institutionId } })
      : undefined
    return this.normalizeUser(user, institution)
  }

  async superAdminSignup(dto: { email: string; password: string }, req: any) {
    // Prevent multiple super admins from being created via public endpoint
    const existingSuperAdmins = await this.prisma.user.count({ where: { role: Role.SUPER_ADMIN } })
    if (existingSuperAdmins > 0) {
      throw new UnauthorizedException('Super admin signup is disabled')
    }

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw new BadRequestException('Email already registered')

    const passwordHash = await argon2.hash(dto.password)
    let user: any
    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          passwordHash,
          role: Role.SUPER_ADMIN,
          status: 'ACTIVE' as UserStatus,
        },
      })
    } catch (e: any) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new BadRequestException('Email already registered')
      }
      throw e
    }

    await this.audit.log({ action: 'SUPER_ADMIN_SIGNUP', entityType: 'User', entityId: user.id, actorId: user.id })

    const res = req?.res
    if (res) {
      await this.setSessionCookies(res, { sub: user.id })
    }

    return this.normalizeUser(user)
  }

  async superAdminLogin(dto: { email: string; password: string }, req: any) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user) throw new UnauthorizedException('Invalid credentials')
    if (user.role !== Role.SUPER_ADMIN) throw new UnauthorizedException('Invalid credentials')

    const ok = await argon2.verify(user.passwordHash, dto.password)
    if (!ok) throw new UnauthorizedException('Invalid credentials')

    const res = req?.res
    if (res) {
      await this.setSessionCookies(res, { sub: user.id })
    }

    await this.audit.log({ action: 'SUPER_ADMIN_LOGIN', entityType: 'User', entityId: user.id, actorId: user.id })
    return this.normalizeUser(user)
  }
}
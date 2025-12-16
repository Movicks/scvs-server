import { SetMetadata } from '@nestjs/common'

export const ROLES_KEY = 'roles'
export type Role = 'SUPER_ADMIN' | 'INSTITUTION_ADMIN' | 'STUDENT' | 'VERIFIER'
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)
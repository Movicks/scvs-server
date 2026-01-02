// Deprecated: Role-based authorization has been removed from the system.
// This guard is kept for reference but should not be provided via APP_GUARD or used in controllers.
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Always allow since roles are no longer enforced
    return true
  }
}
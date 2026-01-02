import { Controller, Patch, Param, UseGuards } from '@nestjs/common'
import { InstitutionsService } from './institutions.service'
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard'
// Removed role-based decorator imports
// import { Roles } from '../common/decorators/roles.decorator'
// import { Role } from '@prisma/client'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiParam } from '@nestjs/swagger'

@ApiTags('institutions')
@ApiBearerAuth('access-token')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly service: InstitutionsService) {}

  @Patch(':id/approve')
  @UseGuards(JwtAccessGuard)
  // removed @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve an institution' })
  @ApiParam({ name: 'id', type: 'string', description: 'Institution ID' })
  @ApiOkResponse({ description: 'Institution approved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  approve(@Param('id') id: string) {
    return this.service.approve(id)
  }

  @Patch(':id/suspend')
  @UseGuards(JwtAccessGuard)
  // removed @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend an institution' })
  @ApiParam({ name: 'id', type: 'string', description: 'Institution ID' })
  @ApiOkResponse({ description: 'Institution suspended successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  suspend(@Param('id') id: string) {
    return this.service.suspend(id)
  }
}
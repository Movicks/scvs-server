import { Controller, Patch, Param, UseGuards } from '@nestjs/common'
import { InstitutionsService } from './institutions.service'
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard'
import { Roles } from '../common/decorators/roles.decorator'
import { Role } from '@prisma/client'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiOkResponse, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiParam } from '@nestjs/swagger'

@ApiTags('institutions')
@ApiBearerAuth('access-token')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly service: InstitutionsService) {}

  @Patch(':id/approve')
  @UseGuards(JwtAccessGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve an institution' })
  @ApiParam({ name: 'id', type: 'string', description: 'Institution ID' })
  @ApiOkResponse({ description: 'Institution approved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  approve(@Param('id') id: string) {
    return this.service.approve(id)
  }

  @Patch(':id/suspend')
  @UseGuards(JwtAccessGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Suspend an institution' })
  @ApiParam({ name: 'id', type: 'string', description: 'Institution ID' })
  @ApiOkResponse({ description: 'Institution suspended successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Insufficient role' })
  suspend(@Param('id') id: string) {
    return this.service.suspend(id)
  }
}
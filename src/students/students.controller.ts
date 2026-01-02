import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common'
import { StudentsService } from './students.service'
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard'
// Removed role-based decorator imports
// import { Roles } from '../common/decorators/roles.decorator'
// import { Role } from '@prisma/client'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger'

@ApiTags('students')
@ApiBearerAuth('access-token')
@Controller('students')
export class StudentsController {
  constructor(private readonly service: StudentsService) {}

  @Post()
  @UseGuards(JwtAccessGuard)
  // removed @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Create a student' })
  @ApiBody({
    description: 'Student creation payload',
    schema: {
      type: 'object',
      properties: {
        fullName: { type: 'string' },
        matricNumber: { type: 'string' },
      },
      required: ['fullName', 'matricNumber'],
    },
  })
  @ApiCreatedResponse({ description: 'Student created successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Institution not approved' })
  create(@CurrentUser() user: any, @Body() dto: { fullName: string; matricNumber: string }) {
    return this.service.create({ institutionId: user.institutionId, fullName: dto.fullName, matricNumber: dto.matricNumber }, user.id)
  }

  @Get()
  @UseGuards(JwtAccessGuard)
  // removed @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'List students for current institution' })
  @ApiOkResponse({ description: 'Students retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Institution not approved' })
  list(@CurrentUser() user: any) {
    return this.service.list(user.institutionId)
  }
}
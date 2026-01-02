import { Controller, Get, Param, Post, Body, UseGuards } from '@nestjs/common'
import { CertificatesService } from './certificates.service'
import { JwtAccessGuard } from '../auth/guards/jwt-access.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger'
import { ApiExtraModels, getSchemaPath } from '@nestjs/swagger'

@ApiTags('certificates')
@ApiBearerAuth('access-token')
@ApiExtraModels()
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly service: CertificatesService) {}

  // In create endpoint, remove @Roles and adjust forbidden description
  @Post()
  @UseGuards(JwtAccessGuard)
  // removed @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Issue a certificate' })
  @ApiBody({
    description: 'Certificate issuance payload',
    schema: {
      type: 'object',
      properties: {
        studentId: { type: 'string' },
        certificateNumber: { type: 'string' },
        metadata: { type: 'object', additionalProperties: true },
        pdfBase64: { type: 'string', description: 'Optional base64-encoded PDF' },
      },
      required: ['studentId', 'certificateNumber', 'metadata'],
    },
  })
  @ApiCreatedResponse({ description: 'Certificate issued successfully' })
  @ApiBadRequestResponse({ description: 'Invalid institution or bad request' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Institution not approved' })
  create(
    @CurrentUser() user: any,
    @Body()
    dto: { studentId: string; certificateNumber: string; metadata: Record<string, any>; pdfBase64?: string },
  ) {
    return this.service.issue({ institutionId: user.institutionId, ...dto }, user.id)
  }

  // In bulk endpoint, remove @Roles and adjust forbidden description
  @Post('bulk')
  @UseGuards(JwtAccessGuard)
  // removed @Roles(Role.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Bulk issue certificates' })
  @ApiBody({
    description: 'Array of certificate issuance payloads',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          studentId: { type: 'string' },
          certificateNumber: { type: 'string' },
          metadata: { type: 'object', additionalProperties: true },
          pdfBase64: { type: 'string', description: 'Optional base64-encoded PDF' },
        },
        required: ['studentId', 'certificateNumber', 'metadata'],
      },
    },
  })
  @ApiCreatedResponse({ description: 'Certificates issued successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Institution not approved' })
  bulk(
    @CurrentUser() user: any,
    @Body()
    dtos: Array<{ studentId: string; certificateNumber: string; metadata: Record<string, any>; pdfBase64?: string }>,
  ) {
    return this.service.bulkIssue(dtos.map(d => ({ institutionId: user.institutionId, ...d })), user.id)
  }

  @Get(':id')
  @UseGuards(JwtAccessGuard)
  @ApiOperation({ summary: 'Get a certificate by ID' })
  @ApiParam({ name: 'id', type: 'string', description: 'Certificate ID' })
  @ApiOkResponse({ description: 'Certificate retrieved successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getOne(@Param('id') id: string) {
    return this.service.getOne(id)
  }

  @Post(':id/revoke')
  @UseGuards(JwtAccessGuard)
  // removed @Roles(Role.INSTITUTION_ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Revoke a certificate' })
  @ApiParam({ name: 'id', type: 'string', description: 'Certificate ID' })
  @ApiOkResponse({ description: 'Certificate revoked successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  revoke(@CurrentUser() user: any, @Param('id') id: string) {
    return this.service.revoke(id, user.id)
  }
}
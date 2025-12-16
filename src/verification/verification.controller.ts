import { Controller, Get, Param, Inject } from '@nestjs/common'
import { VerificationService } from './verification.service'
import { ApiTags, ApiOperation, ApiParam, ApiOkResponse } from '@nestjs/swagger'
import { VerifyResponseDto } from './dto/verify-response.dto'

@ApiTags('verification')
@Controller('verify')
export class VerificationController {
  constructor(private readonly service: VerificationService) {}

  @Get(':certificateNumber')
  @ApiOperation({ summary: 'Publicly verify a certificate by its number' })
  @ApiParam({ name: 'certificateNumber', type: 'string', description: 'Certificate number to verify' })
  @ApiOkResponse({ description: 'Verification result returned', type: VerifyResponseDto })
  async verify(@Param('certificateNumber') certificateNumber: string) {
    return this.service.verifyCertificateNumber(certificateNumber)
  }
}
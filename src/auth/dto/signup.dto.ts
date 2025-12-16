import { IsEmail, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SignupDto {
  @IsEmail()
  @ApiProperty({ description: 'Institution admin email address', example: 'admin@university.edu' })
  email: string

  @IsString()
  @MinLength(8)
  @ApiProperty({ description: 'Password (min 8 characters)', example: 'StrongP@ssw0rd' })
  password: string

  @IsString()
  @ApiProperty({ description: 'Institution official name', example: 'Springfield University' })
  institutionName: string

  @IsString()
  @ApiProperty({ description: 'Accreditation identifier issued by regulator', example: 'NUC-UNI-2024-0001' })
  accreditationId: string

  // Fixed: only institution admin is allowed to sign up
  @ApiProperty({ description: 'User role fixed to INSTITUTION_ADMIN', example: 'INSTITUTION_ADMIN', readOnly: true })
  role: 'INSTITUTION_ADMIN' = 'INSTITUTION_ADMIN'
}
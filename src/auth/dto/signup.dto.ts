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

  // Role is NOT accepted from client; backend defaults to INSTITUTION_ADMIN
}
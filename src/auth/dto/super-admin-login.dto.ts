import { IsEmail, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SuperAdminLoginDto {
  @IsEmail()
  @ApiProperty({ description: 'Super admin email address', example: 'superadmin@example.com' })
  email: string

  @IsString()
  @MinLength(8)
  @ApiProperty({ description: 'Password (min 8 characters)', example: 'StrongP@ssw0rd' })
  password: string
}
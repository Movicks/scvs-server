import { IsEmail, IsString, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class LoginDto {
  @IsEmail()
  @ApiProperty({ description: 'User email address', example: 'admin@university.edu' })
  email: string

  @IsString()
  @MinLength(8)
  @ApiProperty({ description: 'Password (min 8 characters)', example: 'StrongP@ssw0rd' })
  password: string
}
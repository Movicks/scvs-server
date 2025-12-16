import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiUnauthorizedResponse, ApiBadRequestResponse } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { SignupDto } from './dto/signup.dto'
import { LoginDto } from './dto/login.dto'
import { JwtRefreshGuard } from './guards/jwt-refresh.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register new institution admin and institution' })
  @ApiCreatedResponse({ description: 'Signup successful, returns access and refresh tokens' })
  @ApiBadRequestResponse({ description: 'Validation failed or institution already exists' })
  async signup(@Body() dto: SignupDto, @Req() req: any) {
    const result = await this.auth.signup(dto, req)
    return result
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return JWT tokens' })
  @ApiOkResponse({ description: 'Login successful, returns access and refresh tokens' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    return this.auth.login(dto, req)
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiOkResponse({ description: 'Returns new access token' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  async refresh(@CurrentUser() user: any) {
    return this.auth.refresh(user)
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user by invalidating refresh tokens' })
  @ApiOkResponse({ description: 'Logout successful' })
  async logout(@Body('email') email: string) {
    return this.auth.logout(email)
  }
}
import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse, ApiUnauthorizedResponse, ApiBadRequestResponse } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { SignupDto } from './dto/signup.dto'
import { LoginDto } from './dto/login.dto'
import { JwtRefreshGuard } from './guards/jwt-refresh.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import { AuthGuard } from '@nestjs/passport'
import { SuperAdminSignupDto } from './dto/super-admin-signup.dto'
import { SuperAdminLoginDto } from './dto/super-admin-login.dto'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register new institution admin and institution' })
  @ApiCreatedResponse({ description: 'Signup successful, returns user profile' })
  @ApiBadRequestResponse({ description: 'Validation failed or institution already exists' })
  async signup(@Body() dto: SignupDto, @Req() req: any) {
    const result = await this.auth.signup(dto as any, req)
    return { user: result }
  }

  // Super admin signup
  @Post('super-admin/signup')
  @ApiOperation({ summary: 'Register new super admin (restricted)' })
  @ApiCreatedResponse({ description: 'Super admin signup successful' })
  async superAdminSignup(@Body() dto: SuperAdminSignupDto, @Req() req: any) {
    const result = await this.auth.superAdminSignup(dto as any, req)
    return { user: result }
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and return user profile' })
  @ApiOkResponse({ description: 'Login successful, returns user profile' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Req() req: any) {
    const user = await this.auth.login(dto as any, req)
    return { user }
  }

  // Super admin login
  @Post('super-admin/login')
  @ApiOperation({ summary: 'Authenticate super admin and return user profile' })
  @ApiOkResponse({ description: 'Super admin login successful' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async superAdminLogin(@Body() dto: SuperAdminLoginDto, @Req() req: any) {
    const user = await this.auth.superAdminLogin(dto as any, req)
    return { user }
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using a valid refresh token' })
  @ApiOkResponse({ description: 'Returns new access token' })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token' })
  async refresh(@CurrentUser() user: any, @Req() req: any) {
    return this.auth.refresh(user, req)
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout user by invalidating refresh tokens' })
  @ApiOkResponse({ description: 'Logout successful' })
  async logout(@Body('email') email: string, @Req() req: any) {
    return this.auth.logout(email, req)
  }

  // Current user endpoints
  @Get('me')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@CurrentUser() user: any) {
    return this.auth.me(user)
  }

  @Get('user')
  @UseGuards(AuthGuard('jwt-access'))
  @ApiOperation({ summary: 'Get current authenticated user (alias)' })
  async user(@CurrentUser() user: any) {
    return this.auth.me(user)
  }
}
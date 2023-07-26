import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, SetMetadata } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from './entities/user.entity';
import { GetUser } from './decorators/get-user.decorator';
import { UserRoleGuard } from './guards/user-role/user-role.guard';
import { Auth, RoleProtected } from './decorators';
import { ValidRoles } from './interfaces';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('check-auth-status')
  checkAuthStatus(
    @GetUser() user: User,
  ) { 
    return this.authService.checkAuthStatus(user);
  }

  @Get('private')
  @UseGuards(AuthGuard())
  testingPrivateRoute(@GetUser() user: User, @GetUser('email') userEmail: string  ) {
    return {
      ok: true,
      message: 'This is a private route',
      user,
    };
  }

  @Get('private2')
  @Auth( ValidRoles.admin )
  privateRoute2(@GetUser() user: User ) {
    return {
      ok: true,
      message: 'This is a private route',
      user,
    };
  }

 
  
  // @Get('verify/:token')
  // verifyUser(@Param('token') token: string) {
  //   return this.authService.verifyUser(token);
  // }
}

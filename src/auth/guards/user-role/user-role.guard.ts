import { Reflector } from '@nestjs/core';
import { BadRequestException, CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { User } from 'src/auth/entities/user.entity';
import { META_ROLES_KEY } from 'src/auth/decorators/role-protected.decorator';

@Injectable()
export class UserRoleGuard implements CanActivate {

  constructor(
    private readonly reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {

    const validRoles = this.reflector.get<string[]>(META_ROLES_KEY, context.getHandler());

    if(!validRoles) return true;
    if( validRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as User ;

    if(!user) throw new BadRequestException('User not found');

    for (const role of user.roles) {
      if(validRoles.includes(role)) return true;
    }

    throw new ForbiddenException(`You do not have permission to access this route, only ${validRoles} can access this route`);
  }
}

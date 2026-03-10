import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      // If public, still try to activate to attach user if token exists
      // But don't fail if no token
      try {
        await super.canActivate(context);
        return true;
      } catch (e) {
        // If super.canActivate throws (invalid token etc), ignore for public routes
      }
      return true;
    }

    // Since we're overriding to async, we must await the super result if it returns a promise
    // But AuthGuard.canActivate returns boolean | Promise<boolean> | Observable<boolean>
    // We can cast the result to Promise<boolean> or await it
    const result = await super.canActivate(context);
    return result as boolean;
  }
}

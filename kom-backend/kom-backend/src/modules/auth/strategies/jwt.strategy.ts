import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { TokenPayload } from '../dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.accessSecret'),
    });
    // LOGGING FOR DEBUGGING
    const secret = configService.get<string>('jwt.accessSecret');
    console.log(
      '[JwtStrategy] Initialized with secret:',
      secret ? '***' + secret.slice(-5) : 'UNDEFINED',
    );
  }

  async validate(payload: TokenPayload) {
    console.log('[JwtStrategy] Validating payload:', payload);
    try {
      const user = await this.authService.validateUser(payload);

      if (!user) {
        console.error('[JwtStrategy] User validation failed for payload:', payload);
        throw new UnauthorizedException('Invalid token or user not found');
      }

      return user;
    } catch (error) {
      console.error('[JwtStrategy] Validation error:', error);
      throw error;
    }
  }
}

// src/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'votre_secret_jwt_très_long_et_complexe',
    });
  }

  async validate(payload: JwtPayload) {
    let user;
    
    if (payload.role === 'admin') {
      user = await this.authService.validateAdminById(payload.sub);
    } else if (payload.role === 'user') {
      user = await this.authService.validateUserById(payload.sub);
    }
    
    if (!user) {
      throw new UnauthorizedException();
    }
    
    return { 
      id: user.id, 
      nom: user.nom, 
      prenom: user.prenom,
      role: payload.role
    };
  }
}
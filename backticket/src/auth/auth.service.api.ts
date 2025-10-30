import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthApiService {
  constructor(private httpService: HttpService) {}

  async adminLogin(credentials: { nom: string; password: string }) {
    const response = await firstValueFrom(
      this.httpService.post('http://localhost:3000/auth/admin/login', credentials)
    );
    return response.data;
  }

  async userLogin(credentials: { nom: string; password: string }) {
    const response = await firstValueFrom(
      this.httpService.post('http://localhost:3000/auth/user/login', credentials)
    );
    return response.data;
  }
}
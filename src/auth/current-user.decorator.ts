/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { jwtDecode } from 'jwt-decode';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): any => {
    const request: any = ctx?.switchToHttp()?.getRequest();
    const authHeader = request?.headers?.authorization;
    let user: any = null;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      user = jwtDecode(token) as IUser;
    } else {
      throw new Error('Authorization header is missing');
    }

    return user;
  },
);

export interface IUser {
  userId: number;
  companyId: number | null;
  role: string;
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // const request = ctx.switchToHttp().getRequest();
    // return request.user;
    return {
      userId: 1,
      email: 'admin@example.com',
      role: 'PLATFORM_ADMIN',
      companyId: 1,
    };
  },
);

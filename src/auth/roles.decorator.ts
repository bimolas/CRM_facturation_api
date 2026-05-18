import { SetMetadata } from '@nestjs/common';
import { SystemRole } from '../identity/enum/system-role.enum.js';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: SystemRole[]) => SetMetadata(ROLES_KEY, roles);

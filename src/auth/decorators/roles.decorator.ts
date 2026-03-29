import { SetMetadata } from '@nestjs/common';
import { UserRoleType } from '../../common/enums/user-role.enum';

export const Roles = (...roles: UserRoleType[]) => SetMetadata('roles', roles);

import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Puedes importar el enum si quieres validación estricta de roles
// import { UserRoleType } from '../../common/enums/user-role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'usuario@email.com', description: 'Correo electrónico del usuario' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6, description: 'Contraseña (mínimo 6 caracteres)' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Juan Perez', minLength: 2, description: 'Nombre completo del usuario' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiPropertyOptional({ example: 'user', description: 'Rol del usuario (user, admin, moderator, etc). Por defecto: user' })
  @IsOptional()
  @IsString()
  role?: string;
}

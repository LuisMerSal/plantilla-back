# Authentication API - Clean Version

## Descripción

Este es un proyecto de autenticación limpio construido con NestJS, PostgreSQL, Prisma, JWT y control de acceso basado en roles. Ha sido simplificado para incluir únicamente las funcionalidades de autenticación y gestión de usuarios.

## Características

- ✅ **Autenticación JWT**: Login y registro de usuarios
- ✅ **Refresh Tokens**: Tokens de actualización seguros
- ✅ **Control de Roles**: Sistema básico de roles (ADMIN/USER)
- ✅ **API Keys**: Validación de claves API para endpoints administrativos
- ✅ **Validación**: Validación de datos con class-validator
- ✅ **Base de datos**: PostgreSQL con Prisma ORM
- ✅ **Documentación**: Swagger/OpenAPI

## Estructura del Proyecto

```
src/
├── auth/              # Módulo de autenticación
├── user/              # Módulo de usuarios
├── prisma/            # Configuración de Prisma
├── common/            # Enums y utilidades comunes
├── app.module.ts      # Módulo principal
├── app.controller.ts  # Controlador principal (health check)
└── main.ts           # Punto de entrada

prisma/
├── schema.prisma     # Esquema de base de datos
├── seed.ts          # Datos de prueba
└── migrations/      # Migraciones de base de datos
```

## Modelos de Base de Datos

### User
- Información básica del usuario
- Relación con Role
- Relación con RefreshToken

### Role  
- Roles básicos (ADMIN/USER)
- Relación con usuarios

### ApiKey
- Claves API para acceso administrativo

### RefreshToken
- Tokens de actualización JWT
- Expiración automática

## Instalación

1. **Clonar e instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   ```bash
   # Copiar archivo de entorno
   cp environments/dev/.env.example environments/dev/.env
   
   # Editar las variables necesarias
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/auth_db"
   JWT_SECRET="tu-jwt-secret-muy-seguro"
   ```

3. **Configurar base de datos:**
   ```bash
   # Generar cliente Prisma
   npm run prisma:generate
   
   # Ejecutar migraciones
   npm run prisma:migrate
   
   # Sembrar datos de prueba
   npm run seed
   ```

## Scripts Disponibles

```bash
# Desarrollo
npm run start:dev        # Modo desarrollo con hot reload
npm run start:local      # Modo local
npm run start:prod       # Modo producción

# Base de datos
npm run prisma:generate  # Generar cliente Prisma
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio
npm run seed            # Sembrar datos de prueba

# Build y testing
npm run build           # Compilar proyecto
npm run test           # Ejecutar tests
npm run test:e2e       # Tests end-to-end
```

## Usuarios de Prueba

Después de ejecutar `npm run seed`, tendrás estos usuarios disponibles:

### Administrador
- **Email:** admin@test.com
- **Password:** admin123
- **Role:** ADMIN

### Usuario Regular
- **Email:** user@test.com  
- **Password:** user123
- **Role:** USER

### API Key
- **Clave:** admin-api-key-2024

## Endpoints Principales

### Autenticación
```
POST /auth/register     # Registro de usuarios
POST /auth/login        # Login
POST /auth/refresh      # Renovar token
POST /auth/logout       # Logout
```

### Usuarios
```
GET  /user/profile      # Perfil del usuario (requiere JWT)
GET  /user              # Listar usuarios (requiere API Key + JWT Admin)
```

### Salud
```
GET  /                  # Mensaje de bienvenida
GET  /health           # Health check
```

## Autenticación

### JWT Token
Todos los endpoints protegidos requieren el header:
```
Authorization: Bearer <jwt-token>
```

### API Key (Admin)
Los endpoints administrativos requieren también:
```
x-api-key: admin-api-key-2024
```

## Documentación API

Una vez iniciado el servidor, la documentación Swagger estará disponible en:
```
http://localhost:3000/api
```

## Configuración de Entornos

El proyecto soporta múltiples entornos:

- **dev**: Desarrollo
- **local**: Local  
- **prod**: Producción

Cada entorno tiene su archivo `.env` en `environments/{entorno}/.env`

## Docker

Puedes usar Docker para diferentes entornos:

```bash
# Desarrollo
docker-compose -f docker-compose-dev.yml up

# Local
docker-compose -f docker-compose-local.yml up

# Producción  
docker-compose -f docker-compose-prod.yml up
```

## Estructura de Respuestas

### Login Exitoso
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@test.com",
    "name": "Usuario Test",
    "role": "USER"
  }
}
```

### Error
```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT.
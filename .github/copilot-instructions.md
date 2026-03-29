# GitHub Copilot Instructions for eCommerce API

## Project Overview

This is a complete eCommerce API built with NestJS, PostgreSQL, Prisma, JWT authentication, API Key validation, and role-based access control.

## Architecture & Patterns

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens + API Key validation
- **Authorization**: Role-based access control (USER, ADMIN)
- **Validation**: class-validator and class-transformer
- **Environment Management**: Multi-environment configuration (dev/local/prod)

## Code Style Guidelines

1. Use TypeScript strict mode
2. Follow NestJS conventions for decorators and modules
3. Use Prisma client for all database operations
4. Implement proper error handling with NestJS exceptions
5. Use DTOs for request/response validation
6. Apply guards for authentication and authorization

## Security Patterns

- Hash passwords with bcryptjs
- Validate JWT tokens with custom guards
- Require API keys for admin routes
- Use role-based decorators (@Roles) for access control
- Validate all input data with class-validator

## Module Structure

Each module should include:

- `*.module.ts` - Module definition with imports/exports
- `*.service.ts` - Business logic and database operations
- `*.controller.ts` - Route handlers and validation
- `dto/` - Data transfer objects for validation
- `guards/` - Custom authentication/authorization guards

## Database Operations

- Use Prisma client exclusively for database access
- Include proper error handling for not found entities
- Use transactions for complex operations
- Implement proper type safety with Prisma generated types

## Environment Configuration

- Use ConfigModule for environment variables
- Support multiple environments (dev/local/prod)
- Load appropriate .env files based on NODE_ENV
- Keep sensitive data in environment variables

## Testing Guidelines

- Test authentication flows thoroughly
- Validate authorization at route level
- Test database operations with proper mocking
- Include integration tests for complete workflows

## Common Patterns to Follow

1. **Authentication Flow**: Register → Login → JWT Token → Protected Routes
2. **Admin Access**: API Key + JWT + ADMIN Role
3. **Data Validation**: DTOs with class-validator decorators
4. **Error Handling**: NestJS built-in exceptions
5. **Service Layer**: Business logic separated from controllers

## Files to Reference

- `src/auth/` - Authentication and authorization patterns
- `src/admin/` - Complete admin module with all guards
- `prisma/schema.prisma` - Database schema definition
- `environments/*/` - Environment-specific configurations

## Dependencies Used

- @nestjs/common, @nestjs/core, @nestjs/config
- @nestjs/jwt, @nestjs/passport
- @prisma/client, prisma
- passport, passport-jwt, passport-local
- bcryptjs, class-validator, class-transformer

## Docker Support

- Multi-stage builds for production
- Environment-specific Dockerfiles
- Proper Node.js image usage
- Development vs production optimizations

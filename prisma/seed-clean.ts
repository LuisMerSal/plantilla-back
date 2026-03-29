import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log(" Starting database seeding...");

  // Limpiar datos existentes
  console.log(" Cleaning existing data...");
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.apiKey.deleteMany();
  console.log(" Database cleaned");

  // Crear API Key
  console.log(" Creating API Key...");
  const apiKey = await prisma.apiKey.create({
    data: {
      code: "admin-api-key-2024",
      description: "Admin API Key for development",
      isActive: true,
    },
  });
  console.log(` API Key created: ${apiKey.code}`);

  // Crear roles
  console.log(" Creating roles...");
  const adminRole = await prisma.role.create({
    data: {
      name: "ADMIN",
      description: "Administrator with full access",
    },
  });

  const userRole = await prisma.role.create({
    data: {
      name: "USER",
      description: "Regular user",
    },
  });
  console.log(` Roles created: ${adminRole.name}, ${userRole.name}`);

  // Crear usuarios
  console.log(" Creating users...");
  const adminPassword = await bcrypt.hash("admin123", 10);
  const userPassword = await bcrypt.hash("user123", 10);

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@test.com",
      password: adminPassword,
      name: "System Administrator",
      firstName: "Admin",
      lastName: "System",
      dni: "12345678",
      roleId: adminRole.id,
      isActive: true,
    },
  });

  const regularUser = await prisma.user.create({
    data: {
      email: "user@test.com",
      password: userPassword,
      name: "Test User",
      firstName: "Test",
      lastName: "User",
      dni: "87654321",
      roleId: userRole.id,
      isActive: true,
    },
  });

  console.log(` Users created: ${adminUser.email}, ${regularUser.email}`);

  console.log("");
  console.log(" Seed completed successfully!");
  console.log("");
  console.log(" Summary:");
  console.log(`    API Key: ${apiKey.code}`);
  console.log(`    Roles: ${adminRole.name}, ${userRole.name}`);
  console.log(`    Users: 2 created`);
  console.log("");
  console.log(" Test Credentials:");
  console.log("   Admin: admin@test.com / admin123");
  console.log("   User:  user@test.com / user123");
  console.log("");
  console.log(" Server: http://localhost:3001");
  console.log(" Docs:   http://localhost:3001/api");
}

main()
  .catch((error) => {
    console.error(" Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log(" Database connection closed");
  });

import "dotenv/config"
import { defineConfig } from "prisma/config"

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations run DDL, which must go over a direct (unpooled) connection.
    // In prod DATABASE_URL is Neon's pooled endpoint, so prefer DIRECT_URL here.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
})

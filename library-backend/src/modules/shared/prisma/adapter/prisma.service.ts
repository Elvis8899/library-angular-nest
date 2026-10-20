import { PrismaClient } from "@db/generated/client";
import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaPg } from "@prisma/adapter-pg";
import "@shared/utils/config/dotenv";

// Prisma 7 connects through the node-postgres driver. Its pool waits for a
// connection forever by default; Prisma 6 gave up after 5 seconds
export const createPrismaAdapter = (): PrismaPg =>
  new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({ adapter: createPrismaAdapter() });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    return;
  }
}

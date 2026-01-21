import "@shared/utils/dotenv";

export const envConfig = {
  isProduction: process.env.NODE_ENV === "production",
};

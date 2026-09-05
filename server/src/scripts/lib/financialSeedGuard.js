export const assertFinancialSeedAllowed = (env = process.env) => {
  if (String(env.NODE_ENV || "").trim().toLowerCase() === "production") {
    throw new Error("Financial mock data seeding is disabled in production");
  }
};

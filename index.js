import express from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client"; // Import PrismaClient from Prisma

import { userrouter } from "./routes/user.js";
import { adminrouter } from "./routes/admin.js";
import { productrouter } from "./routes/Products.js";
import cors from "cors";

dotenv.config({
  path: "./.env",
});

const prisma = new PrismaClient(); // Instantiate PrismaClient

async function startServer() {
  const port = process.env.PORT;

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.static("ProductImages"));

  app.use("/api/v1/user", userrouter);
  app.use("/api/v1/admin", adminrouter);
  app.use("/api/v1/product", productrouter);

  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      console.log(`Server is running at http://localhost:${port}`);
      resolve(server);
    });
  });
}

async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log("Database is connected");
  } catch (error) {
    console.error("Error connecting to database:", error);
    process.exit(1); // Exit process if database connection fails
  }
}

async function main() {
  try {
    const server = await startServer();
    await connectToDatabase();
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1); // Exit process if server startup or database connection fails
  }
}

main();

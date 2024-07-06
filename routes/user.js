import { Router } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { userMiddleware } from "../middlewares/user.js";
import { run } from "./gpt.js";

export const userrouter = Router();
const prisma = new PrismaClient();
dotenv.config({
  path: "../.env",
});

userrouter.post("/signup", userMiddleware, async (req, res) => {
  const { UserName, Email, Password } = req.body;
  try {
    const user = await prisma.user.findFirst({ where: { Email } });
    if (user) {
      return res.status(409).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(Password, salt);

    const newUser = await prisma.user.create({
      data: {
        Username: UserName,
        Email,
        Password: hashedPassword,
      },
    });

    const token = jwt.sign({ userid: newUser.id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    res.status(201).json({ token, message: "User registered successfully" });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({ message: "Server error", details: error.message });
  }
});

userrouter.post("/signin", userMiddleware, async (req, res) => {
  const { Email, Password } = req.body;
  try {
    const user = await prisma.user.findFirst({ where: { Email } });
    if (!user) {
      return res.status(401).json({ message: "Bad Credentials" });
    }

    const isPasswordValid = await bcrypt.compare(Password, user.Password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid Password" });
    }

    const token = jwt.sign({ userid: user.id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    res.json({ token, message: "Signed In successfully", user });
  } catch (error) {
    console.error("Signin Error:", error);
    res
      .status(500)
      .json({ message: "Error while Signing In", details: error.message });
  }
});

userrouter.post("/gpt", async (req, res) => {
  const { input } = req.body;
  try {
    const response = await run(input);
    res.json({ response });
  } catch (error) {
    console.error("GPT Error:", error);
    res
      .status(500)
      .json({ message: "Error processing request", details: error.message });
  }
});

userrouter.post("/wishlist", async (req, res) => {
  const { UserId, ProductId } = req.body;
  try {
    const wishlist = await prisma.wishList.create({
      data: {
        UserId,
        ProductId,
      },
    });
    res.json({
      message: "Product successfully added to Wishlist.",
      wishlistedProduct: wishlist,
    });
  } catch (error) {
    console.error("Wishlist Error:", error);
    res
      .status(500)
      .json({ message: "Error adding to wishlist", details: error.message });
  }
});

userrouter.post("/deletewishlist", async (req, res) => {
  const { UserId, ProductId } = req.body;
  try {
    const wishlist = await prisma.wishList.findFirst({
      where: { UserId, ProductId },
    });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist item not found" });
    }

    await prisma.wishList.delete({ where: { id: wishlist.id } });

    res.json({
      message: "Product deleted from Wishlist.",
      wishlistedProduct: wishlist,
    });
  } catch (error) {
    console.error("Delete Wishlist Error:", error);
    res
      .status(500)
      .json({
        message: "Error deleting from wishlist",
        details: error.message,
      });
  }
});

userrouter.post("/lockedproduct", async (req, res) => {
  const { UserId } = req.body;
  try {
    const lockproduct = await prisma.user.findFirst({
      where: { id: UserId },
      select: { Product: true },
    });

    if (!lockproduct) {
      return res.status(404).json({ message: "No Bought Product till now." });
    }

    res.json({ product: lockproduct });
  } catch (error) {
    console.error("Locked Product Error:", error);
    res
      .status(500)
      .json({
        message: "Error fetching locked products",
        details: error.message,
      });
  }
});

userrouter.get("/wishlist/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const finduser = await prisma.user.findFirst({
      where: { Email: email },
      select: {
        WishList: {
          select: {
            Product: {
              select: {
                id: true,
                ImageLink: true,
                Title: true,
                Description: true,
                Price: true,
              },
            },
          },
        },
      },
    });

    if (!finduser) {
      return res.status(404).json({ message: "User does not exist." });
    }

    res.json({ wishList: finduser });
  } catch (error) {
    console.error("Wishlist Error:", error);
    res
      .status(500)
      .json({ message: "Error fetching wishlist", details: error.message });
  }
});

import { Router, response } from "express";
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

userrouter.post("/signup", async (req, res) => {
  const userpayload = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: {
        Email: userpayload.Email,
      },
    });
    if (user) {
      return res.status(411).json({
        message: "User already exists",
      });
    }

    const salt = await bcrypt.genSalt(5);
    const hashedpassword = await bcrypt.hash(userpayload.Password, salt);

    const newuser = await prisma.user.create({
      data: {
        Username: userpayload.UserName,
        Email: userpayload.Email,
        Password: hashedpassword,
      },
    });

    const token = jwt.sign({ userid: newuser.id }, process.env.JWT_SECRET_KEY);

    return res.json({
      message: "User created Successfully",
      token: token,
      user: newuser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error while creating User. Please try again.",
      details: error,
    });
  }
});

userrouter.post("/signin", async (req, res) => {
  const userpayload = req.body;
  try {
    const findinguser = await prisma.user.findFirst({
      where: {
        Email: userpayload.Email,
      },
    });
    if (findinguser) {
      const checkpassword = await bcrypt.compare(
        userpayload.Password,
        findinguser.Password
      );

      if (checkpassword) {
        const token = jwt.sign(
          { userid: findinguser.id },
          process.env.JWT_SECRET_KEY
        );
        return res.json({
          message: "Signed In successfully",
          token: token,
          user: findinguser,
        });
      } else {
        return res.status(411).json({
          message: "Invalid Password, Please try again",
        });
      }
    } else {
      return res.status(401).json({
        message: "Bad Credentials. Please try again.",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error while Signing In. Please try again.",
      details: error,
    });
  }
});

userrouter.post("/gpt", async (req, res) => {
  const userpayload = req.body;

  const reponse = await run(userpayload.input);
  return res.json({
    response: reponse,
  });
});

userrouter.post("/wishlist", async (req, res) => {
  const userpayload = req.body;

  try {
    const wishlist = await prisma.wishList.create({
      data: {
        UserId: userpayload.UserId,
        ProductId: userpayload.ProductId,
      },
    });
    return res.json({
      message: "Product successfully added to Wishlist.",
      wishlistedProduct: wishlist,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message:
        "Something went wrong while adding to wishlist, Please try again.",
      details: error,
    });
  }
});
userrouter.post("/deletewishlist", async (req, res) => {
  const userpayload = req.body;

  try {
    const wishlist = await prisma.wishList.findFirst({
      where: {
        UserId: userpayload.UserId,
        ProductId: userpayload.ProductId,
      },
    });

    await prisma.wishList.delete({
      where: {
        id: wishlist.id,
      },
    });

    return res.json({
      message: "Product deleted from to Wishlist.",
      wishlistedProduct: wishlist,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message:
        "Something went wrong while deleting to wishlist, Please try again.",
      details: error,
    });
  }
});

userrouter.post("/lockedproduct", async (req, res) => {
  const userpayload = req.body;
  const lockproduct = await prisma.user.findFirst({
    where: {
      id: userpayload.UserId,
    },
    select: {
      Product: true,
    },
  });

  if (!lockproduct) {
    return res.status(500).json({
      message: "No Bought Product till now.",
    });
  }

  return res.json({
    product: lockproduct,
  });
});
userrouter.get("/wishlist/:email", async (req, res) => {
  const email = req.params.email;

  const finduser = await prisma.user.findFirst({
    where: {
      Email: email,
    },
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
    return res.status(411).json({
      message: "User does not exist.",
    });
  }

  return res.json({
    wishList: finduser,
  });
});

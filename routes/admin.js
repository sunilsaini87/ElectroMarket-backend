import { Router } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcryptjs from "bcryptjs";
import { AdminMiddleware } from "../middlewares/admin.js";
import multer from "multer";
import fs from "fs";
import FormData from "form-data";

const prisma = new PrismaClient();
dotenv.config({
  path: "../.env",
});
export const adminrouter = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./ProductImages");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});
const uploadstorage = multer({ storage: storage });

adminrouter.post("/signup", async (req, res) => {
  const Adminpayload = req.body;
  try {
    const admin = await prisma.admin.findFirst({
      where: {
        Email: Adminpayload.Email,
      },
    });
    if (admin) {
      return res.status(411).json({
        message: "Admin already exists",
      });
    }

    const salt = await bcryptjs.genSalt(5);
    const hashedpassword = await bcryptjs.hash(Adminpayload.Password, salt);

    const newadmin = await prisma.admin.create({
      data: {
        AdminName: Adminpayload.AdminName,
        Email: Adminpayload.Email,
        PhoneNumber: Adminpayload.PhoneNumber,
        Password: hashedpassword,
      },
    });

    const token = jwt.sign(
      { adminid: newadmin.id },
      process.env.JWT_SECRET_KEY
    );

    return res.json({
      message: "Admin created Successfully",
      token: token,
      admin: newadmin,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error while creating Admin. Please try again.",
      details: error,
    });
  }
});

adminrouter.post("/signin", async (req, res) => {
  const Adminpayload = req.body;
  try {
    const findingadmin = await prisma.admin.findFirst({
      where: {
        Email: Adminpayload.Email,
      },
    });
    if (findingadmin) {
      const checkpassword = await bcryptjs.compare(
        Adminpayload.Password,
        findingadmin.Password
      );

      if (checkpassword) {
        const token = jwt.sign(
          { adminid: findingadmin.id },
          process.env.JWT_SECRET_KEY
        );
        return res.json({
          message: "Signed In successfully",
          token: token,
          admin: findingadmin,
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

adminrouter.post(
  "/createproduct",
  uploadstorage.single("file"),
  async (req, res) => {
    const AdminId = req.headers["adminid"]; // Assuming AdminId is passed in the headers
    const payload = req.body;

    // Validate required fields
    if (
      !payload.Title ||
      !payload.Description ||
      !payload.Price ||
      !req.file ||
      !payload.YoutubeLink
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    try {
      const findAdmin = await prisma.admin.findFirst({
        where: {
          id: AdminId, // Use the AdminId from headers
        },
      });

      if (findAdmin) {
        const newproduct = await prisma.product.create({
          data: {
            Title: payload.Title,
            Description: payload.Description,
            Price: parseFloat(payload.Price), // Ensure price is a number
            ImageLink: req.file.filename,
            YoutubeLink: payload.YoutubeLink,
            AdminId: AdminId,
            createdAt: new Date(),
          },
        });

        return res.json({
          message: "Product Created Successfully.",
          product: newproduct,
        });
      } else {
        return res.status(400).json({
          message: "Can't post product because Admin does not exist",
        });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        message:
          "Something went wrong while creating the product. Please try again.",
        details: error,
      });
    }
  }
);

adminrouter.get("/allcreatedProduct", AdminMiddleware, async (req, res) => {
  const AdminId = req.header;
  try {
    const allproducts = await prisma.product.findMany({
      where: {
        AdminId: AdminId,
      },
    });
    return res.json({
      allproducts: allproducts,
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Something went wrong while fetching all products, Please try again.",
      details: error,
    });
  }
});

import { Router } from "express";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
dotenv.config({
  path: "../.env",
});
export const productrouter = Router();
productrouter.get("/bulk", async (req, res) => {
  try {
    const allproducts = await prisma.product.findMany({
      select: {
        id: true,
        Title: true,
        Description: true,
        Price: true,
        ImageLink: true,
        YoutubeLink: true,
        Lock: true,
        createdAt: true,
        Admin: {
          select: {
            AdminName: true,
            Email: true,
            PhoneNumber: true,
          },
        },
      },
    });

    return res.json({
      allproducts: allproducts,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error while fetching all products. Please try again.",
      details: error,
    });
  }
});

productrouter.get("/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const product = await prisma.product.findFirst({
      where: {
        id: id,
      },
      select: {
        Title: true,
        Description: true,
        Price: true,
        ImageLink: true,
        YoutubeLink: true,
        createdAt: true,

        Admin: {
          select: {
            AdminName: true,
            Email: true,
            PhoneNumber: true,
          },
        },
      },
    });
    if (product) {
      return res.json({
        product: product,
      });
    } else {
      return res.status(411).json({
        message: "Invalid Request, Product does not exist",
      });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message:
        "Something went wrong while fetching the product. Please try again.",
      details: error,
    });
  }
});

productrouter.post("/buy", async (req, res) => {
  const userpayload = req.body;
  try {
    const buyproduct = await prisma.product.update({
      where: {
        id: userpayload.ProductId,
      },
      data: {
        Lock: true,
        UserId:userpayload.UserId
      },
    });
    if (!buyproduct) {
      return res.status(500).json({
        message: "Product does not exist.",
      });
    }
    return res.json({
      message: "Product locked successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong while locking the product.",
    });
  }
});

productrouter.get("/SearchProduct/:name", async (req, res) => {
  const productname = req.params.name;
  try {
    const productlist = await prisma.product.findMany({
      where: {
        Title: {
          search: productname,
        },
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Something went wrong while fetching product. Please try again",
      details: error,
    });
  }
});

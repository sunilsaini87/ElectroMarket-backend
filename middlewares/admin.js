import jwt from "jsonwebtoken";
export function AdminMiddleware(req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({
      message: "Error, Please try again.",
    });
  }
  const jwttoken = token.split(" ")[1];
  try {
    const token_verify = jwt.verify(jwttoken, process.env.JWT_SECRET_KEY);
    if (token_verify) {
      req.header = token_verify.adminid;
      next();
    } else {
      return res.status(411).json({
        message: "You are not authorized",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message:
        "Something went wrong while validating the admin, Please try again.",
    });
  }
}

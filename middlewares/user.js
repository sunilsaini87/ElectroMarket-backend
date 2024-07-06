import jwt from "jsonwebtoken";

export function userMiddleware(req, res, next) {
  const { UserName, Email, Password } = req.body;
  if (!UserName || !Email || !Password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  next();
  const token = req.headers.authorization;

  if (!token) {
    return res.status(403).json({
      message: "Error in parsing the token, Please try again.",
    });
  }

  const jwttoken = token.split(" ")[1];

  try {
    const token_verify = jwt.verify(jwttoken, process.env.JWT_SECRET_KEY);
    if (token_verify) {
      // Attach user ID to request header for further use
      req.userId = token_verify.userid;
      next();
    } else {
      return res.status(401).json({
        message: "You are not authorized",
      });
    }
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return res.status(500).json({
      message: "Error validating user token, Please try again.",
    });
  }
}

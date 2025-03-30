import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const JWT_PASSWORD = process.env.JWT_PASSWORD || "12345";

export const userMiddleware = (req, res, next) => {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_PASSWORD);
        req.userId = decoded.id;
        next();
    } catch (err) {
        return res.status(403).json({ message: "Invalid token" });
    }
};

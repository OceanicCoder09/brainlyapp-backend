import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UserModel, ContentModel } from "./db.js";
import { userMiddleware } from "./middleware.js";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const JWT_PASSWORD = process.env.JWT_PASSWORD || "12345";

// User Signup
app.post("/api/v1/signup", async (req, res) => {
    const { username, password } = req.body;

    try {
        await UserModel.create({ username, password });
        res.json({ message: "User signed up" });
    } catch (e) {
        res.status(400).json({ message: "User already exists" });
    }
});

// User Sign-in
app.post("/api/v1/signin", async (req, res) => {
    const { username, password } = req.body;

    const existingUser = await UserModel.findOne({ username, password });
    if (!existingUser) {
        return res.status(403).json({ message: "Incorrect credentials" });
    }

    const token = jwt.sign({ id: existingUser._id }, JWT_PASSWORD, { expiresIn: "7d" });
    res.json({ token });
});

// Add Content
app.post("/api/v1/content", userMiddleware, async (req, res) => {
    const { title, link, type } = req.body;

    try {
        await ContentModel.create({
            title,
            link,
            type,
            userId: req.userId,
            tags: []
        });

        res.json({ message: "Content added" });
    } catch (error) {
        res.status(500).json({ message: "Error adding content", error });
    }
});

// Get Content for User
app.get("/api/v1/content", userMiddleware, async (req, res) => {
    const userId = req.userId;
    const content = await ContentModel.find({
        userId : userId
    }).populate("userId", "username")
    res.json({
        content
    })
});

// Delete Content
app.delete("/api/v1/content/:id", userMiddleware, async (req, res) => {
    const contentId = req.body.contentId;
    await ContentModel.deleteMany({
        contentId,
        userId: req.userId
    })
    res.json({
        message : "Deleted"
    })
});

// Share Brain Content
app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    
});

// Get Shared Content
app.get("/api/v1/brain/:shareLink", async (req, res) => {
    
});

// Root Route
app.get("/", (req, res) => res.send("API is Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

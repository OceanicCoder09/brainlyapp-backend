import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import validator from "validator";
import { UserModel, ContentModel, LinkModel } from "./db.js";
import { userMiddleware } from "./middleware.js";
import { random } from "./utils.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const JWT_PASSWORD = process.env.JWT_PASSWORD || "12345";

// User Signup
app.post("/api/v1/signup", async (req, res) => {
    const { username, password } = req.body;

    // Email validation
    if (!validator.isEmail(username)) {
        return res.status(400).json({ message: "Invalid email format" });
    }

    // Strong password validation
    const strongPassword = validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    });

    if (!strongPassword) {
        return res.status(400).json({
            message:
                "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await UserModel.create({ username, password: hashedPassword });
        res.json({ message: "User signed up" });
    } catch (e) {
        res.status(400).json({ message: "User already exists" });
    }
});

// User Sign-in
app.post("/api/v1/signin", async (req, res) => {
    const { username, password } = req.body;

    const existingUser = await UserModel.findOne({ username });
    if (!existingUser) {
        return res.status(403).json({ message: "Incorrect credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordCorrect) {
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
        userId: userId
    }).populate("userId", "username");

    res.json({ content });
});

// Delete Content
app.delete("/api/v1/content/:id", userMiddleware, async (req, res) => {
    try {
        const contentId = req.params.id;
        const deletedContent = await ContentModel.findOneAndDelete({
            _id: contentId,
            userId: req.userId
        });

        if (!deletedContent) {
            return res.status(404).json({ message: "Content not found or unauthorized" });
        }

        res.json({ message: "Deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting content", error });
    }
});

// Share Brain Content
app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    const share = req.body.share;
    let hash = null;

    if (share) {
        hash = random(10);
        await LinkModel.create({
            userId: req.userId,
            hash: hash
        });
    } else {
        await LinkModel.deleteOne({
            userId: req.userId
        });
    }

    res.json({
        message: "/share/" + hash
    });
});

// Get Shared Content
app.get("/api/v1/brain/:shareLink", async (req, res) => {
    const hash = req.params.shareLink;

    const link = await LinkModel.findOne({ hash });
    if (!link) {
        return res.status(411).json({ message: "Sorry incorrect input" });
    }

    const content = await ContentModel.find({ userId: link.userId });

    const user = await UserModel.findOne({ _id: link.userId });
    if (!user) {
        return res.status(411).json({ message: "user not found, error should ideally not happen" });
    }

    res.json({
        username: user.username,
        content: content
    });
});

// Root Route
app.get("/", (req, res) => res.send("API is Running"));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

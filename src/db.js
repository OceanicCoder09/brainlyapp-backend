import mongoose, { Schema } from "mongoose";

mongoose.connect("mongodb://localhost:27017/brainly", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const UserSchema = new Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});

const ContentSchema = new Schema({
    title: { type: String, required: true },
    link: { type: String, required: true },
    type: { type: String, required: true },
    tags: [{ type: mongoose.Types.ObjectId, ref: 'Tag' }],
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true }
});

const LinkSchema = new Schema({
    hash: { type: String, unique: true, required: true },
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true }
});

export const LinkModel = mongoose.model("Links", LinkSchema)
export const ContentModel = mongoose.model("Content", ContentSchema);
export const UserModel = mongoose.model("User", UserSchema);

import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { registerValidation } from "./validations/auth.js";
import { validationResult } from "express-validator";
import UserModel from "./models/User.js";

mongoose
  .connect(
    "mongodb+srv://alexdermenji:cdvJ3yiazcUcw4eI@cluster0.0tpeqwa.mongodb.net/blog?retryWrites=true&w=majority"
  )
  .then(() => {
    console.log("connected to database");
  })
  .catch((err) => {
    console.log("error connecting to database", err);
  });

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello all world");
});

app.post("/auth/login", async (req, res) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    const isMatch = await bcrypt.compare(req.body.password, user._doc.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }
    const token = jwt.sign({ id: user._id }, "secret", { expiresIn: "30d" });
    const { password, ...userData } = user._doc;
    res.json({ ...userData, token });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/auth/register", registerValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const userPassword = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    const doc = new UserModel({
      fullName: req.body.fullName,
      email: req.body.email,
      password: hashedPassword,
      avatarUrl: req.body.avatarUrl,
    });

    const user = await doc.save();
    const token = jwt.sign({ _id: user._id }, "secret", {
      expiresIn: "30d",
    });

    const { password, ...userData } = user._doc;
    res.json({ ...userData, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
});

app.listen(4444, (err) => {
  if (err) {
    return console.log(err);
  }

  console.log("Server is running OK");
});

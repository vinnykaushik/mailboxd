import * as dotenv from "dotenv";
dotenv.config();
import express from "express";
import pkg from "@prisma/client";
import morgan from "morgan";
import cors from "cors";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";

const app = express();
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

// Middleware to verify JWT token sent by the client
function requireAuth(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // attaching the user id to the request object, this will make it available in the endpoints that use this middleware
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

// test ping endpoint
app.get("/ping", (req, res) => {
  res.send("pong");
});

// register endpoint
app.post("/register", async (req, res) => {
  const { email, password, firstName, lastName, username } = req.body;
  const existingUserByEmail = await prisma.users.findUnique({
    where: { email },
  });
  const existingUserByUsername = await prisma.users.findUnique({
    where: { username },
  });

  const existingUser = existingUserByEmail || existingUserByUsername;

  if (existingUserByEmail) {
    return res.status(400).json({ error: "Email already in use" });
  }

  if (existingUserByUsername) {
    return res.status(400).json({ error: "Username already taken" });
  }
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await prisma.users.create({
    data: {
      email,
      password: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      username,
    },
    select: {
      id: true,
      email: true,
      first_name: true,
      last_name: true,
      username: true,
    },
  });

  const payload = { userId: newUser.id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
  res.cookie("token", token, { httpOnly: true, maxAge: 15 * 60 * 1000 });

  res.json(newUser);
});

// login endpoint
// can only log in using your email
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.users.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const payload = { userId: user.id };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "15m" });
  res.cookie("token", token, { httpOnly: true, maxAge: 15 * 60 * 1000 });

  // ensure that the password is not sent to the client
  const userData = {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
  };

  res.json(userData);
});

// logout endpoint
app.post("/logout", async (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

// requireAuth middleware will validate the access token sent by the client and will return the user information within req.auth
app.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.users.findUnique({
    where: { id: req.userId },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  });
  res.json(user);
});

// USER OPERATIONS ---------------------------------------------------

// get all users endpoint
app.get("/users", async (req, res) => {
  const users = await prisma.users.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  });
  res.json(users);
});

// get user by id endpoint
app.get("/users/:id", async (req, res) => {
  const user = await prisma.users.findUnique({
    where: { id: parseInt(req.params.id) },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

// update user by id endpoint
app.put("/users/:id", requireAuth, async (req, res) => {
  const { email, firstName, lastName, username } = req.body;
  const user = await prisma.users.update({
    where: { id: parseInt(req.params.id) },
    data: { email, firstName, lastName, username },
    select: {
      id: true,
      email: true,
      username: true,
      firstName: true,
      lastName: true,
    },
  });
  res.json(user);
});

// WATCHLIST OPERATIONS ---------------------------------------------------

// create watchlist endpoint
app.post("/users/:id/watchlist", requireAuth, async (req, res) => {
  const { movieId } = req.body;
  const watchlist = await prisma.watchlist.create({
    data: { userId: parseInt(req.params.id), movieId },
    select: { id: true, movie: true, userId: true },
  });
  res.json(watchlist);
});

// get watchlist by user id endpoint
app.get("/users/:id/watchlist", async (req, res) => {
  const watchlist = await prisma.watchlist.findMany({
    where: { userId: parseInt(req.params.id) },
    select: { id: true, movieId: true, userId: true },
  });
  res.json(watchlist);
});

// add movie to watchlist endpoint
app.post("/add-to-watchlist", requireAuth, async (req, res) => {
  const { movieId } = req.body;
  const watchlist = await prisma.watchlist.create({
    data: { userId: req.userId, movieId },
    select: { id: true, movieId: true, userId: true },
  });
  res.json(watchlist);
});

app.listen(8000, () => {
  console.log("Server running on http://localhost:8000 🎉 🚀");
});

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
  try {
    const { email, password, firstName, lastName, username } = req.body;

    console.log("Registration data received:", {
      email,
      password,
      firstName,
      lastName,
      username,
      emailType: typeof email,
    });

    if (typeof email !== "string") {
      return res.status(400).json({
        message: "Email must be a string",
      });
    }

    const existingUserByEmail = await prisma.users.findUnique({
      where: { email },
    });

    const existingUserByUsername = await prisma.users.findUnique({
      where: { username },
    });

    if (existingUserByEmail) {
      return res.status(400).json({
        message: "Email already in use",
      });
    }

    if (existingUserByUsername) {
      return res.status(400).json({
        message: "Username already taken",
      });
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
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });
    res.cookie("token", token, { httpOnly: true, maxAge: 15 * 60 * 1000 });

    res.json(newUser);
  } catch (error) {
    console.error("Registration error:", error);
    console.log("Error details:", error.message);
    res.status(500).json({ message: error.message });
  }
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
      first_name: true,
      last_name: true,
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
      first_name: true,
      last_name: true,
    },
  });
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

// update user by id endpoint
app.put("/users/:id", requireAuth, async (req, res) => {
  const {
    email,
    firstName: first_name,
    lastName: last_name,
    username,
  } = req.body;
  const user = await prisma.users.update({
    where: { id: parseInt(req.params.id) },
    data: { email, firstName: first_name, lastName: last_name, username },
    select: {
      id: true,
      email: true,
      username: true,
      first_name: true,
      last_name: true,
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

// remove movie from watchlist endpoint
app.delete("/remove-from-watchlist", requireAuth, async (req, res) => {
  const { movieId } = req.body;
  const watchlist = await prisma.watchlist.deleteMany({
    where: { userId: req.userId, movieId },
  });
  res.json(watchlist);
});

app.listen(8000, () => {
  console.log("Server running on http://localhost:8000 🎉 🚀");
});

// REVIEW OPERATIONS ---------------------------------------------------
// create review endpoint
app.post("/reviews", requireAuth, async (req, res) => {
  const { movie_id, review_text, rating } = req.body;
  const review = await prisma.reviews.create({
    data: {
      user_id: req.userId,
      movie_id,
      review_text,
      rating,
    },
    select: {
      review_id: true,
      review_text: true,
      rating: true,
      user_id: true,
      movie_id: true,
    },
  });
  res.json(review);
});

// get all reviews endpoint
app.get("/reviews", async (req, res) => {
  const reviews = await prisma.reviews.findMany({
    select: {
      id: true,
      content: true,
      rating: true,
      user_id: true,
      movie_id: true,
    },
  });
  res.json(reviews);
});

// delete review by userid and movieid endpoint
app.delete(
  "/users/:userId/movies/:movieId/delete-review",
  requireAuth,
  async (req, res) => {
    const { userId, movieId } = req.params;
    const review = await prisma.reviews.delete({
      where: {
        user_id: parseInt(userId),
        movie_id: parseInt(movieId),
      },
      select: {
        review_id: true,
        review_text: true,
        rating: true,
        user_id: true,
        movie_id: true,
      },
    });
    res.json(review);
  }
);

// update review by userid and movieid endpoint
app.put(
  "/users/:userId/movies/:movieId/update-review",
  requireAuth,
  async (req, res) => {
    const { userId, movieId } = req.params;
    const { review_text, rating } = req.body;
    const review = await prisma.reviews.update({
      where: {
        user_id: parseInt(userId),
        movie_id: parseInt(movieId),
      },
      data: { review_text, rating },
      select: {
        review_id: true,
        review_text: true,
        rating: true,
        user_id: true,
        movie_id: true,
      },
    });
    res.json(review);
  }
);

// get reviews by user id endpoint
app.get("/users/:id/reviews", async (req, res) => {
  const reviews = await prisma.reviews.findMany({
    where: { user_id: parseInt(req.params.id) },
    select: {
      id: true,
      content: true,
      rating: true,
      user_id: true,
      movie_id: true,
    },
  });
  res.json(reviews);
});

// get reviews by movie id endpoint
app.get("/movies/:id/reviews", async (req, res) => {
  const reviews = await prisma.reviews.findMany({
    where: { movie_id: parseInt(req.params.id) },
    select: {
      review_id: true,
      review_text: true,
      rating: true,
      user_id: true,
      movie_id: true,
      User: {
        select: {
          username: true,
        },
      },
    },
  });
  res.json(reviews);
});

// get reviews by user id and movie id endpoint
app.get("/users/:userId/movies/:movieId/reviews", async (req, res) => {
  const { userId, movieId } = req.params;
  const reviews = await prisma.reviews.findMany({
    where: {
      user_id: parseInt(userId),
      movie_id: parseInt(movieId),
    },
    select: {
      review_id: true,
      review_text: true,
      rating: true,
      user_id: true,
      movie_id: true,
    },
  });
  res.json(reviews);
});

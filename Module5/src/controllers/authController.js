import bcrypt from "bcrypt";
import crypto from "node:crypto";
import users from "../data/users.js";
import { createAccessToken } from "../utils/createAccessToken.js";

export async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "Name, email and password are required",
    });
  }

  const existingUser = users.find((user) => user.email === email);

  if (existingUser) {
    return res.status(409).json({
      message: "Email already registered",
    });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = {
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    role: "user",
  };

  users.push(user);

  return res.status(201).json({
    message: "User registered successfully",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

export async function login(req, res) {
  const { email, password } = req.body;

  const user = users.find((user) => user.email === email);

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  const accessToken = createAccessToken(user);

  return res.status(200).json({
    message: "Login successful",
    accessToken,
  });
}

import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function register(req, res) {
  try {
    // Debug: log incoming request path, auth header and body to help trace 403 issues

    let { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "name , email and password is required" });
    }

    // removing extra space if there
    email = email.trim().toLowerCase();
    name = name.trim();

    //check duplicat3e
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "User already exist" });
    }

    //creating a user
    const user = new User({ name, email, password });
    //saving the user
    await user.save();

    return res
      .status(201)
      .json({ id: user._id, email: user.email, name: user.name });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "server error" });
  }
}

// Login controller — validates input, verifies credentials, and issues JWT token
export async function login(req, res) {
  try {
    // Extract raw email to safely normalize it
    const { email: rawEmail, password } = req.body;

    // Validate required input fields
    if (!rawEmail || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    // Removing extra space if there
    const email = String(rawEmail).trim().toLowerCase();

    //Check if a user with this email exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Compare submitted password with stored hash
    const matched = await user.comparePassword(password);
    if (!matched) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate a JWT token for session/auth
    const token = jwt.sign(
      { id: user._id, role: user.role }, // Payload
      process.env.JWT_SECRET ?? "testsecret", // Secret or fallback
      { expiresIn: "7d" } // Token expiry
    );

    // Return safe user info + token (never return password)
    return res.status(200).json({
      token,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    // Log unexpected errors for debugging
    console.error("Login error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function register(req, res) {
  try {
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


export async function login(req, res) {
  try {
    let { email, password } = req.body;

    //Validatig the input
    if (!email || !password) {
      return res.status(400).json({ error: "email and password required" });
    }

    // trim and change the email to lower case
    email = email.trim().toLowerCase();

    //Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    //Compare password using bcrypt
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "testsecret",
      { expiresIn: "7d" }
    );

    // Return success (but never return password)
    return res.status(200).json({
      token,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "server error" });
  }
}

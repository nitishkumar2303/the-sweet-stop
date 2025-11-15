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
    if (await User.findOne({ email })) {
      return res.status(409).json({ error: "User already exist" });
    }

    // Create + save user
    const user = await User.create({ name, email, password });

    return res
      .status(201)
      .json({ id: user._id, email: user.email, name: user.name });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "server error" });
  }
}

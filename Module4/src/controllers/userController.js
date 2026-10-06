import User from "../models/User.js";
import Order from "../models/Order.js";

export async function createUser(req, res, next) {
  try {
    const { name, email } = req.body;

    if (!name || !email)
      return res.status(400).json({ message: "Name and email are required" });

    if (await User.findOne({ email }))
      return res.status(409).json({ message: "Email already exists" });

    const user = await User.create({ name, email });
    res.status(201).json({ 
      message: "User created successfully"
      ,user });
  } catch (error) {
    next(error);
  }
}

export async function getUsers(req, res, next) {
  try {
    res.json({
      users: await User.find()
        .select("name email createdAt")
        .sort({ createdAt: -1 }),
    });

  } catch (error) {
    next(error);
  }
}

export async function getUserOrders(req, res, next) {
  try {
    const user = await User.findById(req.params.userId).select("name email");

    if (!user){
      return res.status(404).json({ 
        message: "User not found" 
      });
    }

    const orders = await Order.find({ user: user._id })
      .populate("user", "name email")
      .populate("items.product", "name price category")
      .sort({ createdAt: -1 });

    res.json({ user, orders });
    
  } catch (error) {
    next(error);
  }
}

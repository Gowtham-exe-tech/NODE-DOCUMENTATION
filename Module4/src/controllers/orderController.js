import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";


export async function createOrder(req, res) {

  const session = await mongoose.startSession();
  try {
    const { userId, items } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ message: "userId and items are required" });

    session.startTransaction();
    const user = await User.findById(userId).session(session);

    if (!user) throw new Error("User not found");
    const productIds = items.map((item) => item.productId);
    const products = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    }).session(session);

    if (products.length !== productIds.length)
      throw new Error("One or more products were not found");

    const productMap = new Map(
      products.map((product) => [product._id.toString(), product]),
    );

    const orderItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const product = productMap.get(item.productId);
      const quantity = Number(item.quantity);

      if (!product || !Number.isInteger(quantity) || quantity < 1)
        throw new Error("Invalid product or quantity");

      if (product.stock < quantity)
        throw new Error(`${product.name} does not have enough stock`);

      const lineTotal = product.price * quantity;
      orderItems.push({
        product: product._id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        lineTotal,
      });
      totalAmount += lineTotal;
    }

    for (const item of orderItems) {
      const updateResult = await Product.updateOne(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { session },
      );
      if (updateResult.modifiedCount !== 1)
        throw new Error("Stock changed before the order could be completed");
    }

    // Stock changes and order creation must succeed together.
    const [order] = await Order.create(
      [{ user: user._id, items: orderItems, totalAmount }],
      { session },
    );

    await session.commitTransaction();
    const populatedOrder = await Order.findById(order._id)
      .populate("user", "name email")
      .populate("items.product", "name price category");
    res
      .status(201)
      .json({ message: "Order created successfully", order: populatedOrder });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });

  } finally {
    await session.endSession();
  }
}

export async function getOrders(req, res, next) {
  try {
    res.json({
      orders: await Order.find()
        .populate("user", "name email")
        .populate("items.product", "name price category")
        .sort({ createdAt: -1 }),
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderById(req, res, next) {
  try {
    const order = await Order.findById(req.params.orderId)
      .populate("user", "name email")
      .populate("items.product", "name price category");

    if (!order) {
      return res.status(404).json({ 
        message: "Order not found" 
      })};
    res.json({ order });

  } catch (error) {
    next(error);
  }
}

import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
async function seedDatabase() {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.deleteMany({});
  await Product.deleteMany({});
  const users = await User.insertMany([{ name: "Gowtham", email: "gowtham@example.com" }, { name: "Priya", email: "priya@example.com" }]);
  const products = await Product.insertMany([
    { name: "Mechanical Keyboard", description: "Compact keyboard for developers", price: 2499, category: "Accessories", stock: 15 },
    { name: "Wireless Mouse", description: "Quiet wireless mouse", price: 1299, category: "Accessories", stock: 20 },
    { name: "USB-C Hub", description: "Multi-port laptop hub", price: 1899, category: "Accessories", stock: 12 },
    { name: "27-inch Monitor", description: "QHD monitor for work", price: 18999, category: "Monitors", stock: 8 }
  ]);
  console.log("Seed completed");
  users.forEach(user => console.log(`User: ${user.name} | ${user._id}`));
  products.forEach(product => console.log(`Product: ${product.name} | ${product._id}`));
  await mongoose.disconnect();
}
seedDatabase().catch(async error => { console.error("Seed failed:", error.message); await mongoose.disconnect(); process.exit(1); });

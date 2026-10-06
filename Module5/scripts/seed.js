import { env } from "../src/config/env.js";
import { connectDatabase, disconnectDatabase } from "../src/config/database.js";
import { User } from "../src/models/User.js";
import { Product } from "../src/models/Product.js";
import { RefreshToken } from "../src/models/RefreshToken.js";
const products = [
  { name: "Mechanical Keyboard", description: "75% layout hot-swappable keyboard with tactile switches and an aluminium case.", price: 89.99, category: "Peripherals", stock: 45 },
  { name: "Wireless Mouse", description: "Ergonomic 2.4GHz and Bluetooth mouse with a 4000 DPI sensor and silent clicks.", price: 39.99, category: "Peripherals", stock: 120 },
  { name: "USB-C Hub", description: "7-in-1 hub with HDMI 4K, two USB-A ports, SD reader and 100W power delivery.", price: 54.5, category: "Accessories", stock: 80 },
  { name: "27-inch Monitor", description: "27-inch QHD IPS monitor, 75Hz, with USB-C input and height-adjustable stand.", price: 279, category: "Displays", stock: 18 },
  { name: "Laptop Stand", description: "Foldable aluminium stand that lifts a laptop to eye level and improves airflow.", price: 34.99, category: "Accessories", stock: 60 },
  { name: "1080p Webcam", description: "Full HD webcam with autofocus, built-in dual microphones and a privacy shutter.", price: 59, category: "Peripherals", stock: 35 }
];
async function seed() {
  // Protects a real database from being wiped by accident.
  if (env.isProduction) throw new Error("Seeding is disabled when NODE_ENV=production");
  await connectDatabase();
  // Make sure the unique and TTL indexes exist before inserting.
  await Promise.all([User.init(), Product.init(), RefreshToken.init()]);
  // Refresh tokens belong to users, so they are cleared together with the users.
  await Promise.all([User.deleteMany({}), Product.deleteMany({}), RefreshToken.deleteMany({})]);
  const adminPasswordHash = await User.hashPassword("AdminPass2026");
  const userPasswordHash = await User.hashPassword("UserPass2026");
  await User.create([
    { name: "Admin", email: "admin@example.com", passwordHash: adminPasswordHash, role: "admin" },
    { name: "Demo User", email: "user@example.com", passwordHash: userPasswordHash, role: "user" }
  ]);
  await Product.create(products);
  console.log("Seed complete: 2 users and " + products.length + " products created.");
  console.log("Admin: admin@example.com / AdminPass2026");
  console.log("User:  user@example.com / UserPass2026");
}
seed()
  .catch((error) => { console.error("Seed failed:", error.message); process.exitCode = 1; })
  .finally(() => disconnectDatabase());

import Product from "../models/Product.js";

export async function createProduct(req, res, next) {
  try {
    const { name, description, price, category, stock } = req.body;

    if (!name || price === undefined || !category || stock === undefined)
      return res
        .status(400)
        .json({ message: "Name, price, category and stock are required" });

    const product = await Product.create({
      name,
      description,
      price,
      category,
      stock,
    });
    res.status(201).json({ message: "Product created successfully", product });
  } catch (error) {
    next(error);
  }
}

export async function getProducts(req, res, next) {
  try {
    const filter = { isActive: true };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) filter.$text = { $search: req.query.search };

    const products = await Product.find(filter)
      .select("name description price category stock isActive")
      .sort({ createdAt: -1 });
    res.json({ products });

  } catch (error) {
    next(error);
  }
}

export async function getProductById(req, res, next) {
  try {
    const product = await Product.findOne({
      _id: req.params.productId,
      isActive: true,
    });

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product });
    
  } catch (error) {
    next(error);
  }
}

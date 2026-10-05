import products from "../data/products.js";

export function getProducts(req, res) {
  return res.status(200).json({
    products,
  });
}

/*
  Admin-only deletion will be added in the next part.
  The route and controller are intentionally incomplete
  because this practice project stops at around 60%.
*/

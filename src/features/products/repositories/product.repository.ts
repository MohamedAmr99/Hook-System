import { BaseRepository } from "@/lib/firebase/repository";
import { Product } from "../types/product.types";

class ProductRepository extends BaseRepository<Product> {
  constructor() {
    super("products");
  }

  // Add product specific queries here, e.g. getBySku, getActiveProducts, etc.
}

export const productRepository = new ProductRepository();

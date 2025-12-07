import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { products as productsApi, categories } from "../services/api";
import ProductCard from "../components/products/ProductCard";
import ProductSearch from "../components/products/ProductSearch";

const Products = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const categorySlug = searchParams.get("category");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (categorySlug) params.category = categorySlug;
      if (searchQuery) params.search = searchQuery;

      const response = await productsApi.getAll(params);
      setProducts(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [categorySlug, searchQuery]);

  const fetchCategory = useCallback(async () => {
    if (!categorySlug) {
      // Reset category when there's no slug (View All Products)
      setCategory(null);
      return;
    }

    try {
      const response = await categories.getAll();
      const allCategories = response.data.results || response.data;
      const foundCategory = allCategories.find(
        (cat) => cat.slug === categorySlug
      );
      setCategory(foundCategory || null);
    } catch (error) {
      console.error("Error fetching category:", error);
      setCategory(null);
    }
  }, [categorySlug]);

  useEffect(() => {
    fetchProducts();
    fetchCategory();
  }, [categorySlug, searchQuery, fetchProducts, fetchCategory]);

  return (
    <div className="product-page">
      {/* Hero Section */}
      <section className="products-hero">
        <div className="products-hero-overlay"></div>
        <div className="products-hero-content">
          <motion.h1
            className="products-hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            key={category?.name || "all-products"}
          >
            {category ? category.name : "Todos los productos"}
          </motion.h1>
        </div>
      </section>

      {/* Products Section */}
      <section className="products-section">
        <div className="products-container">
          {/* Search and Count */}
          <div className="products-header">
            <ProductSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              productCount={products.length}
            />
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="products-loading">
              <p>Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="products-grid">
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="products-empty">
              <p>No products found</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Products;

// src/pages/ProductDetail.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { products as productsApi } from "../services/api";
import ProductImageGallery from "../components/products/ProductImageGallery";
import ProductInfo from "../components/products/ProductInfo";
import ProductDetailsPanel from "../components/products/ProductDetailsPanel";
import ProductReviewsPanel from "../components/products/ProductReviewsPanel";

const ProductDetail = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePanel, setActivePanel] = useState(null); // 'details' or 'reviews'

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      const response = await productsApi.getBySlug(slug);
      setProduct(response.data);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (activePanel) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activePanel]);

  const openPanel = (panelName) => {
    setActivePanel(panelName);
  };

  const closePanel = () => {
    setActivePanel(null);
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <p>Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-error">
        <p>Product not found</p>
      </div>
    );
  }

  return (
    <>
      <div className="product-detail">
        <div className="product-detail-container">
          {/* Left - Image Gallery */}
          <ProductImageGallery product={product} />

          {/* Right - Product Info */}
          <ProductInfo
            product={product}
            openPanel={openPanel}
            onProductUpdate={fetchProduct}
          />
        </div>
      </div>

      {/* Sliding Panels */}
      <AnimatePresence>
        {activePanel === "details" && (
          <ProductDetailsPanel product={product} onClose={closePanel} />
        )}

        {activePanel === "reviews" && (
          <ProductReviewsPanel
            product={product}
            onClose={closePanel}
            onReviewSubmitted={fetchProduct}
          />
        )}
      </AnimatePresence>

      {/* Overlay */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            className="panel-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePanel}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default ProductDetail;

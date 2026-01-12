// src/components/products/ProductInfo.jsx
import React, { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const ProductInfo = ({ product, openPanel, onProductUpdate }) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      alert("Please login to add items to cart");
      return;
    }

    setIsAdding(true);
    const result = await addToCart(product.id, quantity);

    if (result.success) {
      setQuantity(1);
    } else {
      alert(result.error || "Failed to add to cart");
    }
    setIsAdding(false);
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrement = () => {
    if (quantity < product.stock) setQuantity(quantity + 1);
  };

  return (
    <div className="product-info">
      {/* Product Title */}
      <h1 className="product-detail-title">{product.name}</h1>

      {/* Price */}
      <div className="product-detail-price">
        <span className="price-main">
          ${parseFloat(product.price).toFixed(2)}
        </span>
      </div>

      {/* Expandable Sections */}
      <div className="product-sections">
        {/* Full Description Button */}
        <button className="section-button" onClick={() => openPanel("details")}>
          <span>Descripción</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M7 3L14 10L7 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>

        {/* Reviews Button */}
        <button className="section-button" onClick={() => openPanel("reviews")}>
          <span>Comentarios ({product.review_count || 0})</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M7 3L14 10L7 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Quantity and Add to Cart */}
      <div className="product-actions-section">
        <div className="product-quantity-selector">
          <button
            className="quantity-btn"
            onClick={handleDecrement}
            disabled={quantity <= 1}
          >
            −
          </button>
          <span className="quantity-display">{quantity}</span>
          <button
            className="quantity-btn"
            onClick={handleIncrement}
            disabled={quantity >= product.stock || product.stock === 0}
          >
            +
          </button>
        </div>

        <button
          className="product-detail-add-btn"
          onClick={handleAddToCart}
          disabled={isAdding || product.stock === 0}
        >
          {isAdding ? "AÑADIENDO..." : "AÑADIR AL CARRITO"}
        </button>
      </div>
    </div>
  );
};

export default ProductInfo;

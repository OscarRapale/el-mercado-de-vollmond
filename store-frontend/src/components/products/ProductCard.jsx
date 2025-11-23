import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const ProductCard = ({ product, index }) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

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

  const handleDecrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        delay: index * 0.1,
      },
    },
  };

  // Use alternative image if available, otherwise use main image
  const mainImage = product.image;
  const hoverImage = product.alternative_image || product.image;

  return (
    <motion.div
      className="product-card"
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${product.slug}`} className="product-card-link">
        {/* Image Container */}
        <div className="product-card-image-container">
          <div className="product-card-image">
            <img
              src={isHovered ? hoverImage : mainImage}
              alt={product.name}
              className="product-image"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="product-card-content">
          <h3 className="product-card-title">{product.name}</h3>

          <p className="product-card-description">
            {product.short_description || product.description}
          </p>

          <div className="product-card-footer">
            <div className="product-card-price">
              ${parseFloat(product.price).toFixed(2)}
            </div>
            {product.original_price &&
              parseFloat(product.original_price) >
                parseFloat(product.price) && (
                <div className="product-card-price-club">
                  ${parseFloat(product.original_price).toFixed(2)} Wine Club
                  Price
                </div>
              )}
          </div>
        </div>
        {/* Hover Overlay with Add to Cart */}
          <motion.div
            className="product-card-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="product-card-actions">
              <div className="product-quantity">
                <button
                  className="quantity-btn"
                  onClick={handleDecrement}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="quantity-value">{quantity}</span>
                <button
                  className="quantity-btn"
                  onClick={handleIncrement}
                  disabled={quantity >= product.stock || product.stock === 0}
                >
                  +
                </button>
              </div>

              <button
                className="product-add-btn"
                onClick={handleAddToCart}
                disabled={isAdding || product.stock === 0}
              >
                {isAdding ? "ADDING..." : "ADD TO CART"}
              </button>
            </div>
          </motion.div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;

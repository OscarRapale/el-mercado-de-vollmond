import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";

const ProductCard = ({ product, index }) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  // Detect if device is mobile/touch screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 1024 || "ontouchstart" in window);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

  // Image fade variants
  const imageVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    exit: {
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  // Use alternative image if available, otherwise use main image
  const mainImage = product.image;
  const hoverImage = product.alternative_image || product.image;
  const currentImage = isHovered ? hoverImage : mainImage;

  // Show actions on mobile or on hover for desktop
  const showActions = isMobile || isHovered;

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
            <AnimatePresence mode="wait">
              <motion.img
                key={currentImage} // Key changes trigger the animation
                src={currentImage}
                alt={product.name}
                className="product-image"
                variants={imageVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              />
            </AnimatePresence>
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
          </div>

          {/* Actions - Always visible on mobile */}
          <motion.div
            className="product-card-actions-wrapper"
            initial={{
              opacity: isMobile ? 1 : 0,
              height: isMobile ? "auto" : 0,
            }}
            animate={{
              opacity: showActions ? 1 : 0,
              height: showActions ? "auto" : 0,
            }}
            transition={{ duration: isMobile ? 0 : 0.3 }}
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
                {isAdding ? (
                  "AÑADIENDO..."
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M6 16C4.9 16 4.01 16.9 4.01 18C4.01 19.1 4.9 20 6 20C7.1 20 8 19.1 8 18C8 16.9 7.1 16 6 16ZM0 0V2H2L5.6 9.59L4.25 12.04C4.09 12.32 4 12.65 4 13C4 14.1 4.9 15 6 15H18V13H6.42C6.28 13 6.17 12.89 6.17 12.75L6.2 12.63L7.1 11H14.55C15.3 11 15.96 10.59 16.3 9.97L19.88 3.48C19.96 3.34 20 3.17 20 3C20 2.45 19.55 2 19 2H4.21L3.27 0H0ZM16 16C14.9 16 14.01 16.9 14.01 18C14.01 19.1 14.9 20 16 20C17.1 20 18 19.1 18 18C18 16.9 17.1 16 16 16Z"
                        fill="currentColor"
                      />
                    </svg>
                    AÑADIR
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;

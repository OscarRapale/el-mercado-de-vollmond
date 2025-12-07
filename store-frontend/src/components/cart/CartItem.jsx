// src/components/cart/CartItem.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const CartItem = ({ item, index, onRemove, onUpdateQuantity }) => {
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRemove = async () => {
    setIsRemoving(true);
    await onRemove(item.id);
  };

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1) return;

    setIsUpdating(true);
    await onUpdateQuantity(item.id, newQuantity);
    setIsUpdating(false);
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        delay: index * 0.1,
        duration: 0.4,
      },
    },
    exit: {
      opacity: 0,
      x: 20,
      height: 0,
      marginBottom: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <motion.div
      className="cart-item"
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      {/* Product Image */}
      <Link to={`/products/${item.product.slug}`} className="cart-item-image">
        <img src={item.product.image} alt={item.product.name} />
      </Link>

      {/* Product Info */}
      <div className="cart-item-info">
        <Link to={`/products/${item.product.slug}`} className="cart-item-name">
          {item.product.name}
        </Link>

        <div className="cart-item-price">
          ${parseFloat(item.product.price).toFixed(2)}
        </div>

        {/* Mobile Quantity & Remove */}
        <div className="cart-item-actions-mobile">
          <div className="cart-item-quantity">
            <button
              className="quantity-btn"
              onClick={() => handleQuantityChange(item.quantity - 1)}
              disabled={isUpdating || item.quantity <= 1}
            >
              −
            </button>
            <span className="quantity-value">{item.quantity}</span>
            <button
              className="quantity-btn"
              onClick={() => handleQuantityChange(item.quantity + 1)}
              disabled={isUpdating || item.quantity >= item.product.stock}
            >
              +
            </button>
          </div>

          <button
            className="cart-item-remove-mobile"
            onClick={handleRemove}
            disabled={isRemoving}
          >
            {isRemoving ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>

      {/* Quantity Controls - Desktop */}
      <div className="cart-item-quantity-desktop">
        <button
          className="quantity-btn"
          onClick={() => handleQuantityChange(item.quantity - 1)}
          disabled={isUpdating || item.quantity <= 1}
        >
          −
        </button>
        <span className="quantity-value">{item.quantity}</span>
        <button
          className="quantity-btn"
          onClick={() => handleQuantityChange(item.quantity + 1)}
          disabled={isUpdating || item.quantity >= item.product.stock}
        >
          +
        </button>
      </div>

      {/* Subtotal - Desktop */}
      <div className="cart-item-subtotal">
        ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
      </div>

      {/* Remove Button - Desktop */}
      <button
        className="cart-item-remove"
        onClick={handleRemove}
        disabled={isRemoving}
        aria-label="Remove item"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M15 5L5 15M5 5L15 15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </motion.div>
  );
};

export default CartItem;

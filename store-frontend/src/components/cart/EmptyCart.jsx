// src/components/cart/EmptyCart.jsx
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const EmptyCart = () => {
  return (
    <motion.div
      className="empty-cart"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="empty-cart-icon">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle
            cx="60"
            cy="60"
            r="58"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M36 96C31.6 96 28.06 99.6 28.06 104C28.06 108.4 31.6 112 36 112C40.4 112 44 108.4 44 104C44 99.6 40.4 96 36 96ZM20 20V28H28L41.6 55.59L37.25 63.04C36.89 63.72 36.67 64.55 36.67 65.43C36.67 69.83 40.27 73.43 44.67 73.43H92V65.43H46.52C46.09 65.43 45.75 65.09 45.75 64.66L45.85 64.26L48.5 59H75.43C78.4 59 80.95 57.47 82.3 55.13L95.87 30.88C96.13 30.44 96.27 29.9 96.27 29.33C96.27 27.1 94.5 25.33 92.27 25.33H36.01L32.67 17.33H20V20ZM84 96C79.6 96 76.06 99.6 76.06 104C76.06 108.4 79.6 112 84 112C88.4 112 92 108.4 92 104C92 99.6 88.4 96 84 96Z"
            fill="currentColor"
          />
          <line
            x1="30"
            y1="90"
            x2="90"
            y2="30"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <h2 className="empty-cart-title">Tu carrito está vacío</h2>
      <p className="empty-cart-description">
        Parece que aún no has agregado nada a tu carrito.
        <br />
        ¡Explora nuestros productos y encuentra algo que te encante!
      </p>

      <Link to="/products" className="empty-cart-btn">
        Explorar Productos
      </Link>
    </motion.div>
  );
};

export default EmptyCart;

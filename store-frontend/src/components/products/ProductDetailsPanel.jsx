// src/components/products/ProductDetailsPanel.jsx
import React from "react";
import { motion } from "framer-motion";

const ProductDetailsPanel = ({ product, onClose }) => {
  const panelVariants = {
    hidden: { x: "100%" },
    visible: {
      x: 0,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
      },
    },
    exit: {
      x: "100%",
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
      },
    },
  };

  return (
    <motion.div
      className="sliding-panel"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Close Button */}
      <button className="panel-close-btn" onClick={onClose}>
        <span className="close-x">✕</span>
      </button>

      {/* Panel Content */}
      <div className="panel-content">
        <h2 className="panel-title">Detalles del Producto</h2>

        {/* Full Description */}
        <div className="panel-section">
          <h3>Descripción</h3>
          <p>{product.description}</p>
        </div>

        {/* Additional Details */}
        <div className="panel-section">
          {product.stock !== undefined && (
            <div className="detail-item">
              <span className="detail-label">Disponible:</span>
              <span className="detail-value">{product.stock}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetailsPanel;

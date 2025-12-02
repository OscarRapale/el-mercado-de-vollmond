// src/components/products/ProductDetailsPanel.jsx
import React from 'react';
import { motion } from 'framer-motion';

const ProductDetailsPanel = ({ product, onClose }) => {
  const panelVariants = {
    hidden: { x: '100%' },
    visible: {
      x: 0,
      transition: {
        type: 'spring',
        damping: 30,
        stiffness: 300,
      },
    },
    exit: {
      x: '100%',
      transition: {
        type: 'spring',
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
        CLOSE <span className="close-x">✕</span>
      </button>

      {/* Panel Content */}
      <div className="panel-content">
        <h2 className="panel-title">Product Details</h2>

        {/* Full Description */}
        <div className="panel-section">
          <h3>Description</h3>
          <p>{product.description}</p>
        </div>

        {/* Technical Info */}
        {product.technical_info && (
          <div className="panel-section">
            <h3>Technical Information</h3>
            <div dangerouslySetInnerHTML={{ __html: product.technical_info }} />
          </div>
        )}

        {/* Winemaking */}
        {product.winemaking_info && (
          <div className="panel-section">
            <h3>Winemaking</h3>
            <div dangerouslySetInnerHTML={{ __html: product.winemaking_info }} />
          </div>
        )}

        {/* Additional Details */}
        <div className="panel-section">
          <h3>Details</h3>
          <div className="detail-grid">
            {product.category && (
              <div className="detail-item">
                <span className="detail-label">Category:</span>
                <span className="detail-value">{product.category.name}</span>
              </div>
            )}
            {product.stock !== undefined && (
              <div className="detail-item">
                <span className="detail-label">Stock:</span>
                <span className="detail-value">{product.stock} available</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductDetailsPanel;

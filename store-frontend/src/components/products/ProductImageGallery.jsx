// src/components/products/ProductImageGallery.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ProductImageGallery = ({ product }) => {
  const [selectedImage, setSelectedImage] = useState(product.image);

  // Create array of images (main + alternative)
  const images = [product.image];
  if (product.alternative_image) {
    images.push(product.alternative_image);
  }

  return (
    <div className="product-gallery">
      {/* Main Image */}
      <div className="product-gallery-main">
        <motion.img
          key={selectedImage}
          src={selectedImage}
          alt={product.name}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Thumbnail Images (if more than one) */}
      {images.length > 1 && (
        <div className="product-gallery-thumbnails">
          {images.map((image, index) => (
            <button
              key={index}
              className={`gallery-thumbnail ${selectedImage === image ? 'active' : ''}`}
              onClick={() => setSelectedImage(image)}
            >
              <img src={image} alt={`${product.name} ${index + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductImageGallery;

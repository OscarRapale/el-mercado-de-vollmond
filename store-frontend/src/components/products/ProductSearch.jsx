import React from "react";

const ProductSearch = ({ searchQuery, setSearchQuery, productCount }) => {
  return (
    <div className="product-search-container">
      {/* Left - Product Count */}
      <div className="product-count">
        <span className="count-number">{productCount}</span>
        <span className="count-label">ARTÍCULOS</span>
      </div>
    </div>
  );
};

export default ProductSearch;

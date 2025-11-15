// src/components/home/CategoryShowcase.jsx
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { categories } from '../../services/api';
import categoryPlaceholder from '../../assets/images/category.png'; 

const CategoryShowcase = () => {
  const [categoriesList, setCategoriesList] = useState([]);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categories.getAll();
      setCategoriesList(response.data.results || response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const scroll = (direction) => {
    const container = document.querySelector('.category-scroll');
    const scrollAmount = 300;
    
    if (direction === 'left') {
      container.scrollLeft -= scrollAmount;
    } else {
      container.scrollLeft += scrollAmount;
    }
  };

  return (
    <section className="category-showcase">
      <div className="category-showcase-container">
        {/* Header */}
        <div className="category-header">
          <h2 className="category-title">Start your shopping</h2>
          
          <div className="category-nav-buttons">
            <button 
              className="category-nav-btn" 
              onClick={() => scroll('left')}
              aria-label="Scroll left"
            >
              ←
            </button>
            <button 
              className="category-nav-btn" 
              onClick={() => scroll('right')}
              aria-label="Scroll right"
            >
              →
            </button>
          </div>
        </div>

        {/* Category Scroll */}
        <div className="category-scroll">
          {categoriesList.map((category, index) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="category-card"
            >
              <div className="category-card-image">
                <img
                  src={categoryPlaceholder}
                  alt={category.name}
                />
              </div>
              
              <div className="category-card-content">
                <h3 className="category-card-title">{category.name}</h3>
                {category.description && (
                  <p className="category-card-subtitle">{category.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;

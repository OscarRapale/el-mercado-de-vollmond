// src/components/home/CategoryShowcase.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { categories } from "../../services/api";
import categoryPlaceholder from "../../assets/images/category.png";

const CategoryShowcase = () => {
  const [categoriesList, setCategoriesList] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categories.getAll();
      setCategoriesList(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  return (
    <section className="category-showcase">
      <div className="category-showcase-container">
        {/* Header */}
        <div className="category-header">
          <h2 className="category-title">Comienza tu Aventura</h2>
        </div>

        {/* Category Grid */}
        <div className="category-scroll">
          {categoriesList.map((category, index) => (
            <Link
              key={category.id}
              to={`/products?category=${category.slug}`}
              className="category-card"
              onMouseEnter={() => setHoveredCard(category.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <div className="category-card-image">
                <img src={category.image || categoryPlaceholder} alt={category.name} />

                {/* Overlay with title */}
                <motion.div
                  className="category-card-overlay"
                  initial={{ y: "100%" }}
                  animate={{ y: hoveredCard === category.id ? "0%" : "100%" }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <h3 className="category-card-title">{category.name}</h3>
                  {category.description && (
                    <p className="category-card-subtitle">
                      {category.description}
                    </p>
                  )}
                </motion.div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryShowcase;

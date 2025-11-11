// src/components/home/Hero.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="hero-fullwidth">
      <div className="hero-background">
        <img
          src="https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1920&q=80"
          alt="Books"
          className="hero-bg-image"
        />
        <div className="hero-overlay"></div>
      </div>

      <div className="hero-content-center">
        <motion.div
          className="hero-text-center"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h1 className="hero-main-title">
            A WORLD
            <br />
            OF
            <br />
            ENCHANTMENT
          </h1>
          
          <Link to="/products" className="hero-cta-btn">
            DISCOVER OUR BOOKS
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;

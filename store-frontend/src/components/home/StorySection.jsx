// src/components/home/StorySection.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const StorySection = () => {
  return (
    <section className="story-section">
      <div className="story-container">
        {/* Label */}
        <div className="story-label">
          <span>OUR DNA</span>
        </div>

        {/* Content Grid */}
        <div className="story-grid">
          {/* Left - Image */}
          <motion.div
            className="story-image"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img
              src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80"
              alt="Fantasy Books"
            />
          </motion.div>

          {/* Right - Text */}
          <motion.div
            className="story-content"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="story-title">
              Enchantment is our style. A story of
              authenticity, imagination,
              and passion.
            </h2>

            <p className="story-description">
              From the very beginning, we have crafted tales that transport readers
              to magical realms, working alongside authors and artists who share our
              commitment to storytelling excellence. We care for readers by creating
              immersive, thought-provoking narratives designed to ignite imagination
              and touch hearts.
            </p>

            <Link to="/about" className="story-btn">
              DISCOVER OUR STORY
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StorySection;

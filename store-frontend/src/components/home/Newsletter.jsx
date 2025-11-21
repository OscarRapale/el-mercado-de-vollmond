// src/components/home/Newsletter.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Newsletter = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    agree: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Newsletter signup:', formData);
    // add actual functionality later
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <section className="newsletter-section">
      <div className="newsletter-grid">
        {/* Left - Image */}
        <motion.div
          className="newsletter-image"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <img
            src="https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&q=80"
            alt="Books and Coffee"
          />
        </motion.div>

        {/* Right - Form */}
        <motion.div
          className="newsletter-content"
          initial={{ opacity: 0, x: 50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="newsletter-title">
            Subscribe to our
            <br />
            newsletter
          </h2>

          <p className="newsletter-subtitle">
            Stay informed about our latest releases
          </p>

          <form onSubmit={handleSubmit} className="newsletter-form">
            <input
              type="text"
              name="firstName"
              placeholder="First Name*"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="newsletter-input"
            />

            <input
              type="email"
              name="email"
              placeholder="E-mail*"
              value={formData.email}
              onChange={handleChange}
              required
              className="newsletter-input"
            />

            <label className="newsletter-checkbox">
              <input
                type="checkbox"
                name="agree"
                checked={formData.agree}
                onChange={handleChange}
                required
              />
              <span>
                I confirm that I have read the privacy policy and I agree to receive newsletters
                including promotional/advertising content as well as promotional offers
                specifically dedicated to me.
              </span>
            </label>

            <button type="submit" className="newsletter-btn-animated">
              Suscribir
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default Newsletter;

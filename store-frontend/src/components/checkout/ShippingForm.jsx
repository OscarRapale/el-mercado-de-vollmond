// src/components/checkout/ShippingForm.jsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ShippingForm = ({ initialData, onSubmit }) => {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'El nombre es requerido';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'El apellido es requerido';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido';
    }
    if (!formData.address.trim()) {
      newErrors.address = 'La dirección es requerida';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'La ciudad es requerida';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'El estado es requerido';
    }
    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'El código postal es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <motion.div
      className="shipping-form"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="form-title">Información de Envío</h2>

      <form onSubmit={handleSubmit} className="checkout-form">
        {/* Name Fields */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="first_name">Nombre *</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={errors.first_name ? 'error' : ''}
            />
            {errors.first_name && (
              <span className="error-message">{errors.first_name}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Apellido *</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={errors.last_name ? 'error' : ''}
            />
            {errors.last_name && (
              <span className="error-message">{errors.last_name}</span>
            )}
          </div>
        </div>

        {/* Contact Fields */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Teléfono *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={errors.phone ? 'error' : ''}
            />
            {errors.phone && (
              <span className="error-message">{errors.phone}</span>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="form-group">
          <label htmlFor="address">Dirección *</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className={errors.address ? 'error' : ''}
            placeholder="Calle y número"
          />
          {errors.address && (
            <span className="error-message">{errors.address}</span>
          )}
        </div>

        {/* City, State, Postal Code */}
        <div className="form-row-three">
          <div className="form-group">
            <label htmlFor="city">Ciudad *</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={errors.city ? 'error' : ''}
            />
            {errors.city && (
              <span className="error-message">{errors.city}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="state">Estado *</label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleChange}
              className={errors.state ? 'error' : ''}
            />
            {errors.state && (
              <span className="error-message">{errors.state}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="postal_code">Código Postal *</label>
            <input
              type="text"
              id="postal_code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              className={errors.postal_code ? 'error' : ''}
            />
            {errors.postal_code && (
              <span className="error-message">{errors.postal_code}</span>
            )}
          </div>
        </div>

        {/* Country */}
        <div className="form-group">
          <label htmlFor="country">País *</label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
          >
            <option value="US">Estados Unidos</option>
            <option value="PR">Puerto Rico</option>
            <option value="MX">México</option>
            <option value="ES">España</option>
          </select>
        </div>

        {/* Submit Button */}
        <button type="submit" className="form-submit-btn">
          Continuar al Pago
        </button>
      </form>
    </motion.div>
  );
};

export default ShippingForm;

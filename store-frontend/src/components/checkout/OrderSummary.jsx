// src/components/checkout/OrderSummary.jsx
import React from 'react';
import { motion } from 'framer-motion';

const OrderSummary = ({ cart }) => {
  return (
    <motion.div
      className="order-summary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h3 className="summary-title">Resumen del Pedido</h3>

      {/* Cart Items */}
      <div className="summary-items">
        {cart.items.map((item) => (
          <div key={item.id} className="summary-item">
            <div className="summary-item-image">
              <img src={item.product.image} alt={item.product.name} />
              <span className="item-quantity">{item.quantity}</span>
            </div>
            <div className="summary-item-details">
              <p className="item-name">{item.product.name}</p>
              <p className="item-price">
                ${parseFloat(item.product.price).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Details */}
      <div className="summary-pricing">
        <div className="pricing-row">
          <span>Subtotal</span>
          <span>${parseFloat(cart.subtotal || 0).toFixed(2)}</span>
        </div>

        {cart.discount_amount > 0 && (
          <div className="pricing-row discount">
            <span>Descuento</span>
            <span>-${parseFloat(cart.discount_amount).toFixed(2)}</span>
          </div>
        )}

        <div className="pricing-row">
          <span>Envío</span>
          <span>
            {cart.shipping_cost > 0
              ? `$${parseFloat(cart.shipping_cost).toFixed(2)}`
              : 'Calculado'}
          </span>
        </div>

        <div className="pricing-row total">
          <span>Total</span>
          <span>${parseFloat(cart.total || 0).toFixed(2)}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default OrderSummary;

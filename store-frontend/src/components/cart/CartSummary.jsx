// src/components/cart/CartSummary.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const CartSummary = ({
  cart,
  couponCode,
  setCouponCode,
  couponError,
  couponLoading,
  onApplyCoupon,
  onRemoveCoupon,
}) => {
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate("/checkout");
  };

  return (
    <motion.div
      className="cart-summary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <h2 className="cart-summary-title">Resumen del Pedido</h2>

      {/* Order Details */}
      <div className="cart-summary-details">
        <div className="summary-row">
          <span>Subtotal</span>
          <span>${parseFloat(cart.subtotal || 0).toFixed(2)}</span>
        </div>

        {cart.discount_amount > 0 && (
          <div className="summary-row summary-discount">
            <span>
              Descuento
              {cart.coupon && (
                <span className="coupon-badge">
                  {cart.coupon.code}
                  <button
                    className="remove-coupon-btn"
                    onClick={onRemoveCoupon}
                    disabled={couponLoading}
                  >
                    ✕
                  </button>
                </span>
              )}
            </span>
            <span>-${parseFloat(cart.discount_amount || 0).toFixed(2)}</span>
          </div>
        )}

        <div className="summary-row">
          <span>Envío</span>
          <span>
            {cart.shipping_cost > 0
              ? `$${parseFloat(cart.shipping_cost).toFixed(2)}`
              : "Calculado en checkout"}
          </span>
        </div>

        <div className="summary-row summary-total">
          <span>Total</span>
          <span>${parseFloat(cart.total || 0).toFixed(2)}</span>
        </div>
      </div>

      {/* Coupon Code */}
      {!cart.coupon && (
        <form onSubmit={onApplyCoupon} className="coupon-form">
          <input
            type="text"
            placeholder="Código de Cupón"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="coupon-input"
            disabled={couponLoading}
          />
          <button
            type="submit"
            className="coupon-btn"
            disabled={couponLoading || !couponCode.trim()}
          >
            {couponLoading ? "..." : "Aplicar"}
          </button>
        </form>
      )}

      {couponError && <div className="coupon-error">{couponError}</div>}

      {/* Checkout Button */}
      <button className="checkout-btn" onClick={handleCheckout}>
        Proceder al Pago
      </button>

      {/* Security Badge */}
      <div className="security-badge">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1L3 3V7C3 10.5 5.5 13.5 8 14.5C10.5 13.5 13 10.5 13 7V3L8 1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Pago Seguro</span>
      </div>
    </motion.div>
  );
};

export default CartSummary;

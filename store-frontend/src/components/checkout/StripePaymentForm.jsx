// src/components/checkout/StripePaymentForm.jsx
import React, { useState } from "react";
import { cart as cartApi } from "../../services/api";
import {
  FaCcVisa,
  FaCcMastercard,
  FaCcAmex,
  FaApplePay,
  FaGooglePay,
  FaCcDiscover,
} from "react-icons/fa";

const StripePaymentForm = ({ shippingInfo, cart, onBack }) => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  // Calculate display total with fallback
  const getDisplayTotal = () => {
    if (cart.total && !isNaN(parseFloat(cart.total))) {
      return parseFloat(cart.total).toFixed(2);
    }

    const subtotal = parseFloat(cart.subtotal) || 0;
    const shipping = parseFloat(cart.shipping_cost) || 5.0;
    const discount = parseFloat(cart.discount_amount) || 0;
    const tax = parseFloat(cart.tax) || 0;
    const total = subtotal + shipping - discount + tax;

    return total.toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setProcessing(true);
    setError(null);

    try {
      // Create order with shipping info - matching your backend exactly
      const orderData = {
        email: shippingInfo.email,
        first_name: shippingInfo.first_name,
        last_name: shippingInfo.last_name,
        address_line1: shippingInfo.address,
        address_line2: shippingInfo.address_line2 || "",
        city: shippingInfo.city,
        state: shippingInfo.state,
        postal_code: shippingInfo.postal_code,
        country: shippingInfo.country,
        phone: shippingInfo.phone,
        payment_method: "stripe",
        // Include coupon if applied
        coupon_code: cart.coupon?.code || "",
        // Success/Cancel URLs
        success_url: `${window.location.origin}/order/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${window.location.origin}/cart`,
      };

      console.log("Creating order with data:", orderData);

      const response = await cartApi.createOrder(orderData);

      console.log("Order created:", response.data);

      // Backend returns checkout_url - redirect to Stripe
      if (response.data.checkout_url) {
        console.log(
          "Redirecting to Stripe Checkout:",
          response.data.checkout_url
        );
        window.location.href = response.data.checkout_url;
      } else {
        setError("No se pudo crear la sesión de pago");
        setProcessing(false);
      }
    } catch (err) {
      console.error("Payment error:", err);
      console.error("Error response:", err.response?.data);
      setError(
        err.response?.data?.error ||
          "Error procesando el pago. Por favor intenta de nuevo."
      );
      setProcessing(false);
    }
  };

  const displayTotal = getDisplayTotal();

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <div className="checkout-info-card">
        <h3>Confirma tu Pedido</h3>

        <div className="checkout-summary-grid">
          <div className="summary-row">
            <span>Subtotal:</span>
            <span>${parseFloat(cart.subtotal || 0).toFixed(2)}</span>
          </div>

          {cart.discount_amount > 0 && (
            <div className="summary-row discount">
              <span>
                Descuento {cart.coupon ? `(${cart.coupon.code})` : ""}:
              </span>
              <span>-${parseFloat(cart.discount_amount).toFixed(2)}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Envío:</span>
            <span>${parseFloat(cart.shipping_cost || 5).toFixed(2)}</span>
          </div>

          {cart.tax > 0 && (
            <div className="summary-row">
              <span>Impuestos:</span>
              <span>${parseFloat(cart.tax).toFixed(2)}</span>
            </div>
          )}

          <div className="summary-row total">
            <span>Total:</span>
            <strong>${displayTotal}</strong>
          </div>
        </div>

        <div className="checkout-notice">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle
              cx="10"
              cy="10"
              r="9"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M10 6v5M10 13.5v.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <p>
            Serás redirigido a Stripe para completar el pago de forma segura.
          </p>
        </div>
      </div>

      {error && (
        <div className="payment-error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="7"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M8 4v4M8 10.5v.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        className="payment-submit-btn"
        disabled={processing}
      >
        {processing ? (
          <span className="btn-loading">
            <svg className="spinner" viewBox="0 0 24 24" width="20" height="20">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray="31.4 31.4"
                strokeLinecap="round"
              />
            </svg>
            Redirigiendo a Stripe...
          </span>
        ) : (
          `Proceder al Pago - $${displayTotal}`
        )}
      </button>

      <div className="payment-security">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M8 1L3 3V7C3 10.5 5.5 13.5 8 14.5C10.5 13.5 13 10.5 13 7V3L8 1Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M6 8L7.5 9.5L10 6.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>Pago 100% seguro procesado por Stripe</span>
      </div>

      <div className="accepted-payments">
        <p>Aceptamos:</p>
        <div className="payment-icons">
          <FaCcVisa size={45} />
          <FaCcMastercard size={45} />
          <FaCcDiscover size={45} />
          <FaCcAmex size={45} />
          <FaApplePay size={45} />
          <FaGooglePay size={45} />
        </div>
      </div>
    </form>
  );
};

export default StripePaymentForm;

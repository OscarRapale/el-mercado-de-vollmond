// src/components/checkout/PaymentForm.jsx
import React from "react";
import { motion } from "framer-motion";
import StripePaymentForm from "./StripePaymentForm";

const PaymentForm = ({
  shippingInfo,
  cart,
  paymentMethod,
  setPaymentMethod,
  onBack,
}) => {
  return (
    <motion.div
      className="payment-form"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="form-title">Método de Pago</h2>

      {/* Payment Method Selection */}
      <div className="payment-methods">
        <label
          className={`payment-method-option ${
            paymentMethod === "stripe" ? "active" : ""
          }`}
        >
          <input
            type="radio"
            name="paymentMethod"
            value="stripe"
            checked={paymentMethod === "stripe"}
            onChange={(e) => setPaymentMethod(e.target.value)}
          />
          <div className="payment-method-content">
            <svg width="48" height="32" viewBox="0 0 48 32" fill="none">
              <rect width="48" height="32" rx="4" fill="#635BFF" />
              <path
                d="M20 11.5C20 10.6716 20.6716 10 21.5 10H26.5C27.3284 10 28 10.6716 28 11.5V20.5C28 21.3284 27.3284 22 26.5 22H21.5C20.6716 22 20 21.3284 20 20.5V11.5Z"
                fill="white"
              />
            </svg>
            <div>
              <strong>Pago con Stripe</strong>
              <p>Débito, Credito, Apple Pay, Google Pay y más</p>
            </div>
          </div>
        </label>
      </div>

      {/* Stripe Payment Form */}
      {paymentMethod === "stripe" && (
        <StripePaymentForm
          shippingInfo={shippingInfo}
          cart={cart}
          onBack={onBack}
        />
      )}
    </motion.div>
  );
};

export default PaymentForm;

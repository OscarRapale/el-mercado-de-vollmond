// src/components/checkout/PaymentForm.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripePaymentForm from "./StripePaymentForm";
import { stripe as stripeApi } from "../../services/api";

// Initialize Stripe
let stripePromise = null;

const PaymentForm = ({
  shippingInfo,
  cart,
  paymentMethod,
  setPaymentMethod,
  onBack,
  onSuccess,
}) => {
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeError, setStripeError] = useState(null);

  // Initialize Stripe
  React.useEffect(() => {
    const initializeStripe = async () => {
      if (!stripePromise) {
        setStripeLoading(true);
        try {
          const response = await stripeApi.getConfig();
          const publishableKey = response.data.publicKey;

          if (!publishableKey) {
            throw new Error("Stripe publishable key not found");
          }

          stripePromise = loadStripe(publishableKey);
          setStripeError(null);
        } catch (error) {
          console.error("Error loading Stripe:", error);
          setStripeError(
            "Failed to load payment system. Please refresh the page."
          );
        } finally {
          setStripeLoading(false);
        }
      }
    };

    initializeStripe();
  }, []);

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
              <strong>Tarjeta de Crédito/Débito</strong>
              <p>Pago seguro con Stripe</p>
            </div>
          </div>
        </label>
      </div>

      {/* Error Message */}
      {stripeError && <div className="payment-error">{stripeError}</div>}

      {/* Loading State */}
      {stripeLoading && (
        <div className="payment-loading">
          <p>Cargando sistema de pago...</p>
        </div>
      )}

      {/* Stripe Payment Form */}
      {paymentMethod === "stripe" &&
        stripePromise &&
        !stripeLoading &&
        !stripeError && (
          <Elements stripe={stripePromise}>
            <StripePaymentForm
              shippingInfo={shippingInfo}
              cart={cart}
              onBack={onBack}
              onSuccess={onSuccess}
            />
          </Elements>
        )}

      {/* Back Button */}
      <button type="button" className="back-btn" onClick={onBack}>
        ← Volver a Envío
      </button>
    </motion.div>
  );
};

export default PaymentForm;

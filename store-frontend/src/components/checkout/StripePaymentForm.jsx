// src/components/checkout/StripePaymentForm.jsx
import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { cart as cartApi } from "../../services/api";

const StripePaymentForm = ({ shippingInfo, cart, onBack, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create order in backend
      const orderData = {
        shipping_address: shippingInfo,
        payment_method: "stripe",
      };

      const response = await cartApi.createOrder(orderData);

      if (response.data.client_secret) {
        // Confirm payment with Stripe
        const { error: stripeError, paymentIntent } =
          await stripe.confirmCardPayment(response.data.client_secret, {
            payment_method: {
              card: elements.getElement(CardElement),
              billing_details: {
                name: `${shippingInfo.first_name} ${shippingInfo.last_name}`,
                email: shippingInfo.email,
                phone: shippingInfo.phone,
                address: {
                  line1: shippingInfo.address,
                  city: shippingInfo.city,
                  state: shippingInfo.state,
                  postal_code: shippingInfo.postal_code,
                  country: shippingInfo.country,
                },
              },
            },
          });

        if (stripeError) {
          setError(stripeError.message);
          setProcessing(false);
        } else if (paymentIntent.status === "succeeded") {
          onSuccess(response.data.order);
        }
      } else {
        onSuccess(response.data.order);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Error procesando el pago");
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1a1a1a",
        "::placeholder": {
          color: "#6b7280",
        },
      },
      invalid: {
        color: "#c62828",
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <div className="form-group">
        <label>Información de la Tarjeta</label>
        <div className="card-element-wrapper">
          <CardElement options={cardElementOptions} />
        </div>
      </div>

      {error && <div className="payment-error">{error}</div>}

      <button
        type="submit"
        className="payment-submit-btn"
        disabled={!stripe || processing}
      >
        {processing
          ? "Procesando..."
          : `Pagar $${parseFloat(cart.total).toFixed(2)}`}
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
        </svg>
        <span>Tu pago está protegido con cifrado SSL</span>
      </div>
    </form>
  );
};

export default StripePaymentForm;

// src/components/checkout/StripePaymentForm.jsx
import React, { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { cart as cartApi } from "../../services/api";

const StripePaymentForm = ({ shippingInfo, cart, onBack, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [cardComplete, setCardComplete] = useState(false);

  // Safely calculate total - fallback to subtotal if total is missing
  const getDisplayTotal = () => {
    // Try total first, then calculate from subtotal
    if (cart.total && !isNaN(parseFloat(cart.total))) {
      return parseFloat(cart.total).toFixed(2);
    }
    
    // Fallback: calculate from subtotal + shipping
    const subtotal = parseFloat(cart.subtotal) || 0;
    const shipping = parseFloat(cart.shipping_cost) || 5.00;
    const discount = parseFloat(cart.discount_amount) || 0;
    const total = subtotal + shipping - discount;
    
    return total.toFixed(2);
  };

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setError(event.error.message);
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!cardComplete) {
      setError("Por favor completa la información de tu tarjeta");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // Create order in backend
      const orderData = {
        email: shippingInfo.email,
        first_name: shippingInfo.first_name,
        last_name: shippingInfo.last_name,
        address_line1: shippingInfo.address,
        city: shippingInfo.city,
        state: shippingInfo.state,
        postal_code: shippingInfo.postal_code,
        country: shippingInfo.country,
        phone: shippingInfo.phone,
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
      } else if (response.data.checkout_url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkout_url;
      } else {
        onSuccess(response.data.order);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(
        err.response?.data?.error || 
        "Error procesando el pago. Por favor intenta de nuevo."
      );
      setProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1a1a1a",
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
        fontSmoothing: "antialiased",
        "::placeholder": {
          color: "#6b7280",
        },
        iconColor: "#1a1a1a",
      },
      invalid: {
        color: "#c62828",
        iconColor: "#c62828",
      },
    },
    hidePostalCode: true, // We already collect this in shipping form
  };

  const displayTotal = getDisplayTotal();

  return (
    <form onSubmit={handleSubmit} className="stripe-form">
      <div className="form-group">
        <label>Información de la Tarjeta</label>
        <div className={`card-element-wrapper ${error ? 'has-error' : ''} ${cardComplete ? 'complete' : ''}`}>
          <CardElement 
            options={cardElementOptions} 
            onChange={handleCardChange}
          />
        </div>
        <div className="card-brands">
          <span className="card-brand-label">Aceptamos:</span>
          <div className="card-brand-icons">
            <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-labelledby="visa">
              <title id="visa">Visa</title>
              <path fill="#1434CB" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/>
              <path fill="#fff" d="M28.3 10.1H28c-.4 1-.7 1.5-1 3h1.9c-.3-1.5-.3-2.2-.6-3zm2.9 5.9h-1.7c-.1 0-.1 0-.2-.1l-.2-.9-.1-.2h-2.4c-.1 0-.2 0-.2.2l-.3.9c0 .1-.1.1-.1.1h-2.1l.2-.5L27 8.7c0-.5.3-.7.8-.7h1.5c.1 0 .2 0 .2.2l1.4 6.5c.1.4.2.7.2 1.1.1.1.1.1.1.2zm-13.4-.3l.4-1.8c.1 0 .2.1.2.1.7.3 1.4.5 2.1.4.2 0 .5-.1.7-.2.5-.2.5-.7.1-1.1-.2-.2-.5-.3-.8-.5-.4-.2-.8-.4-1.1-.7-1.2-1-.8-2.4-.1-3.1.6-.64.3-.7 1.2-.9h2.1c.1 0 .1.1.2.1l-.3 1.5c0 .2-.1.2-.2.2s-.2-.1-.2-.1c-.7-.3-1.4-.5-2.1-.4-.2 0-.5.1-.7.2-.5.2-.5.7-.1 1.1.2.2.5.3.8.5.4.2.8.4 1.1.7 1.2 1 .8 2.4.1 3.1-.7.6-1.5.9-2.5.9-.5 0-1 0-1.4-.1-.1 0-.3 0-.4-.1-.1 0-.1-.1-.1-.2zm-3.5.3c.1-.7.1-.7.2-1 .5-2.2 1-4.5 1.4-6.7.1-.2.1-.3.3-.3H18c-.2 1.2-.4 2.1-.7 3.2-.3 1.5-.6 3-1 4.5 0 .2-.1.2-.3.2h-1.7c0 .1-.1.1-.1.1zm-4.3 0l2.1-6.9c0-.1 0-.1.1-.2h3.1c.3 0 .5 0 .7.2.5.5.5 1.1.4 1.8-.2 1.4-.9 2.3-2.1 2.6-.5.1-1 .2-1.5.2h-.6l-.4 2.2c0 .1-.1.2-.2.2h-1.6v.1z"/>
            </svg>
            <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-labelledby="mastercard">
              <title id="mastercard">Mastercard</title>
              <path fill="#000" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/>
              <circle fill="#EB001B" cx="15" cy="12" r="7"/>
              <circle fill="#F79E1B" cx="23" cy="12" r="7"/>
              <path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z"/>
            </svg>
            <svg viewBox="0 0 38 24" width="38" height="24" role="img" aria-labelledby="amex">
              <title id="amex">American Express</title>
              <path fill="#006FCF" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z"/>
              <path fill="#fff" d="M8.971 10.268l.774 1.876H8.203l.768-1.876zm16.075.078h-2.977v.827h2.929v1.239h-2.923v.922h2.977v.739l2.077-2.245-2.077-2.228-.006.746zm-14.063-2.34h3.995l.887 1.935.822-1.935h3.989v5.604l-3.208.018-3.91-3.97v3.97h-2.681l-.476-1.131H6.182l-.471 1.131H2.627L5.093 8.006h2.89zm12.035 5.618h-3.894l3.2-3.468h-3.2V8.006h3.894l-3.2 3.342h3.2v2.276zm6.635-5.618l2.526 2.866-2.526 2.752h2.005l1.461-1.689 1.478 1.689h1.965l-2.5-2.752 2.5-2.866h-1.965l-1.478 1.725-1.461-1.725h-2.005z"/>
            </svg>
          </div>
        </div>
      </div>

      {error && (
        <div className="payment-error">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8 4v4M8 10.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        className="payment-submit-btn"
        disabled={!stripe || processing || !cardComplete}
      >
        {processing ? (
          <span className="btn-loading">
            <svg className="spinner" viewBox="0 0 24 24" width="20" height="20">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="31.4 31.4" strokeLinecap="round"/>
            </svg>
            Procesando...
          </span>
        ) : (
          `Pagar $${displayTotal}`
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
        <span>Tu pago está protegido con cifrado SSL</span>
      </div>
    </form>
  );
};

export default StripePaymentForm;

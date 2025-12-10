// src/pages/Checkout.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CheckoutSteps from "../components/checkout/CheckoutSteps";
import ShippingForm from "../components/checkout/ShippingForm";
import PaymentForm from "../components/checkout/PaymentForm";
import OrderSummary from "../components/checkout/OrderSummary";

const Checkout = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [shippingInfo, setShippingInfo] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
    country: "US",
  });
  const [paymentMethod, setPaymentMethod] = useState("stripe");

  const { cart, loading } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!loading && (!cart || cart.items.length === 0)) {
      navigate("/cart");
    }
  }, [isAuthenticated, cart, loading, navigate]);

  // Pre-fill user info if available
  useEffect(() => {
    if (user) {
      setShippingInfo((prev) => ({
        ...prev,
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  const handleShippingSubmit = (data) => {
    setShippingInfo(data);
    setCurrentStep(2);
  };

  const handleBackToShipping = () => {
    setCurrentStep(1);
  };

  const handlePaymentSuccess = (orderData) => {
    // Navigate to order confirmation
    navigate(`/order-confirmation/${orderData.id}`);
  };

  if (loading || !cart) {
    return (
      <div className="checkout-loading">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        {/* Progress Steps */}
        <CheckoutSteps currentStep={currentStep} />

        <div className="checkout-content">
          {/* Forms Section */}
          <div className="checkout-forms">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <ShippingForm
                  key="shipping"
                  initialData={shippingInfo}
                  onSubmit={handleShippingSubmit}
                />
              )}

              {currentStep === 2 && (
                <PaymentForm
                  key="payment"
                  shippingInfo={shippingInfo}
                  cart={cart}
                  paymentMethod={paymentMethod}
                  setPaymentMethod={setPaymentMethod}
                  onBack={handleBackToShipping}
                  onSuccess={handlePaymentSuccess}
                />
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          <OrderSummary cart={cart} />
        </div>
      </div>
    </div>
  );
};

export default Checkout;

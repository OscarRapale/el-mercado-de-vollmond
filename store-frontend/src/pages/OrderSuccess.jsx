// src/pages/OrderSuccess.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [orderTotal, setOrderTotal] = useState(null);
  const navigate = useNavigate();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (!sessionId) {
      navigate("/orders");
      return;
    }

    // Fetch order details from backend using session_id
    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/orders/by-session/${sessionId}/`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setOrderTotal(parseFloat(data.total).toFixed(2));
        }
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [sessionId, navigate]);

  const handleContinue = () => {
    navigate("/products");
  };

  const handleViewOrders = () => {
    navigate("/orders");
  };

  if (loading) {
    return (
      <div className="order-success-overlay">
        <div className="success-loading-card">
          <motion.div
            className="success-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
              <circle
                cx="25"
                cy="25"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray="125"
                strokeDashoffset="30"
              />
            </svg>
          </motion.div>
          <p>Verificando tu pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success-overlay">
      <AnimatePresence>
        <motion.div
          className="success-card"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.5, type: "spring" }}
        >
          {/* Close background on click (optional) */}
          <div
            className="success-card-backdrop"
            onClick={() => navigate("/orders")}
          />

          <div className="success-card-content">
            {/* Success Icon */}
            <motion.div
              className="success-checkmark"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                delay: 0.2,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
            >
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
                <circle cx="50" cy="50" r="48" fill="white" />
                <motion.path
                  d="M30 50L43 63L70 36"
                  stroke="#045c46"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.5, duration: 0.6, ease: "easeOut" }}
                />
              </svg>
            </motion.div>

            {/* Amount */}
            {orderTotal && (
              <motion.h1
                className="success-amount"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                ${orderTotal}
              </motion.h1>
            )}

            {/* Message */}
            <motion.div
              className="success-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <h2>Tu pago está completo.</h2>
              <p>
                Por favor revisa el estado de entrega en la
                <br />
                página de <strong>Seguimiento de Pedidos</strong>
              </p>
            </motion.div>

            {/* Buttons */}
            <motion.div
              className="success-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <button className="success-continue-btn" onClick={handleContinue}>
                Continuar Comprando
              </button>

              <button
                className="success-orders-link"
                onClick={handleViewOrders}
              >
                Ver mis pedidos →
              </button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OrderSuccess;

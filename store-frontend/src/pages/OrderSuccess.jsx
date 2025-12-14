// src/pages/OrderSuccess.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      // No session ID, redirect to orders immediately
      navigate('/orders');
      return;
    }

    // Payment successful - show success message
    setLoading(false);

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/orders');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId, navigate]);

  if (loading) {
    return (
      <div className="order-success-loading">
        <motion.div
          className="success-spinner"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <circle 
              cx="30" 
              cy="30" 
              r="25" 
              stroke="currentColor" 
              strokeWidth="4"
              strokeDasharray="157"
              strokeDashoffset="40"
            />
          </svg>
        </motion.div>
        <p>Verificando tu pago...</p>
      </div>
    );
  }

  return (
    <div className="order-success-page">
      <AnimatePresence>
        <motion.div
          className="success-message"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="success-icon"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
              <circle 
                cx="50" 
                cy="50" 
                r="48" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <motion.path
                d="M30 50L45 65L70 35"
                stroke="currentColor"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              />
            </svg>
          </motion.div>
          
          <h1>¡Pago Exitoso!</h1>
          <p className="success-description">
            Tu pedido ha sido procesado correctamente y recibirás un email de confirmación en breve.
          </p>

          <div className="order-info-box">
            <p>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 5h2v6H9V5zm0 8h2v2H9v-2z" fill="currentColor"/>
              </svg>
              Puedes ver los detalles de tu pedido en la sección "Mis Pedidos"
            </p>
          </div>

          <div className="action-buttons">
            <Link to="/orders" className="btn-primary">
              Ver Mis Pedidos
            </Link>
            <Link to="/products" className="btn-secondary">
              Continuar Comprando
            </Link>
          </div>

          <p className="redirect-message">
            Redirigiendo automáticamente en {countdown} segundo{countdown !== 1 ? 's' : ''}...
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OrderSuccess;

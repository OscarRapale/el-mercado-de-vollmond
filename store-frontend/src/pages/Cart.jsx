// src/pages/Cart.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CartItem from "../components/cart/CartItem";
import CartSummary from "../components/cart/CartSummary";
import EmptyCart from "../components/cart/EmptyCart";

const Cart = () => {
  const {
    cart,
    loading,
    removeFromCart,
    updateCartItem,
    applyCoupon,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    const result = await applyCoupon(couponCode);

    if (result.success) {
      setCouponCode("");
    } else {
      setCouponError(result.error || "Invalid coupon code");
    }

    setCouponLoading(false);
  };

  const handleRemoveCoupon = async () => {
    setCouponLoading(true);
    await applyCoupon(""); // Empty string removes coupon
    setCouponLoading(false);
  };

  if (loading) {
    return (
      <div className="cart-loading">
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        {/* Page Header */}
        <motion.div
          className="cart-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="cart-title">Tu Carrito</h1>
          <p className="cart-subtitle">
            {cart.items.length}{" "}
            {cart.items.length === 1 ? "artículo" : "artículos"}
          </p>
        </motion.div>

        <div className="cart-content">
          {/* Cart Items */}
          <div className="cart-items-section">
            <AnimatePresence>
              {cart.items.map((item, index) => (
                <CartItem
                  key={item.id}
                  item={item}
                  index={index}
                  onRemove={removeFromCart}
                  onUpdateQuantity={updateCartItem}
                />
              ))}
            </AnimatePresence>

            {/* Continue Shopping Link */}
            <motion.div
              className="continue-shopping"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Link to="/products" className="continue-shopping-link">
                ← Continuar Comprando
              </Link>
            </motion.div>
          </div>

          {/* Cart Summary */}
          <CartSummary
            cart={cart}
            couponCode={couponCode}
            setCouponCode={setCouponCode}
            couponError={couponError}
            couponLoading={couponLoading}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
          />
        </div>
      </div>
    </div>
  );
};

export default Cart;

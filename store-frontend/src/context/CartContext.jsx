import React, { createContext, useState, useEffect, useContext } from "react";
import { cart as cartApi } from "../services/api";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponApplied, setCouponApplied] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart(null);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      const response = await cartApi.getCurrent();
      setCart(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const response = await cartApi.addItem({
        product_id: productId,
        quantity,
      });
      setCart(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to add item",
      };
    }
  };

  const updateCartItem = async (cartItemId, quantity) => {
    try {
      const response = await cartApi.updateItem({
        cart_item_id: cartItemId,
        quantity,
      });
      setCart(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to update item",
      };
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      const response = await cartApi.removeItem({ cart_item_id: cartItemId });
      setCart(response.data);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to remove item",
      };
    }
  };

  const clearCart = async () => {
    try {
      await cartApi.clear();
      setCart(null);
      setCouponApplied(null);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Failed to clear cart",
      };
    }
  };

  const applyCoupon = async (code) => {
    try {
      const response = await cartApi.applyCoupon(code);
      setCouponApplied(response.data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || "Invalid coupon code",
      };
    }
  };

  const cartItemCount = cart?.total_items || 0;
  const cartSubtotal = cart?.subtotal || 0;

  const value = {
    cart,
    loading,
    couponApplied,
    cartItemCount,
    cartSubtotal,
    fetchCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    applyCoupon,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

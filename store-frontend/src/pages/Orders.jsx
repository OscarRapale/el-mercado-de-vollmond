// src/pages/Orders.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { orders as ordersApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchOrders();
  }, [isAuthenticated]);

  const fetchOrders = async () => {
    try {
      const response = await ordersApi.getAll();
      setOrders(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: "status-pending",
      processing: "status-processing",
      shipped: "status-shipped",
      delivered: "status-delivered",
      cancelled: "status-cancelled",
    };
    return statusMap[status] || "status-pending";
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: "Pendiente",
      processing: "Procesando",
      shipped: "Enviado",
      delivered: "Entregado",
      cancelled: "Cancelado",
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <p>Cargando pedidos...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-empty">
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="empty-icon">
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
              <path
                d="M40 96C35.6 96 32.06 99.6 32.06 104C32.06 108.4 35.6 112 40 112C44.4 112 48 108.4 48 104C48 99.6 44.4 96 40 96ZM24 24V32H32L45.6 59.59L41.25 67.04C40.89 67.72 40.67 68.55 40.67 69.43C40.67 73.83 44.27 77.43 48.67 77.43H96V69.43H50.52C50.09 69.43 49.75 69.09 49.75 68.66L49.85 68.26L52.5 63H79.43C82.4 63 84.95 61.47 86.3 59.13L99.87 34.88C100.13 34.44 100.27 33.9 100.27 33.33C100.27 31.1 98.5 29.33 96.27 29.33H40.01L36.67 21.33H24V24ZM88 96C83.6 96 80.06 99.6 80.06 104C80.06 108.4 83.6 112 88 112C92.4 112 96 108.4 96 104C96 99.6 92.4 96 88 96Z"
                fill="currentColor"
                opacity="0.3"
              />
            </svg>
          </div>
          <h2>No tienes pedidos</h2>
          <p>Parece que aún no has realizado ningún pedido.</p>
          <Link to="/products" className="btn-primary">
            Explorar Productos
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        {/* Page Header */}
        <motion.div
          className="orders-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="orders-title">Mis Pedidos</h1>
          <p className="orders-subtitle">
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
          </p>
        </motion.div>

        {/* Orders List */}
        <div className="orders-list">
          {orders.map((order, index) => (
            <motion.div
              key={order.id}
              className="order-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {/* Order Header */}
              <div className="order-card-header">
                <div className="order-info">
                  <h3 className="order-number">Pedido #{order.order_number}</h3>
                  <p className="order-date">
                    {new Date(order.created_at).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div
                  className={`order-status-badge ${getStatusBadgeClass(
                    order.status
                  )}`}
                >
                  {getStatusText(order.status)}
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="order-items-preview">
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="order-item-preview">
                    <img
                      src={
                        item.image ||
                        "https://via.placeholder.com/80?text=N/A"
                      }
                      alt={item.product_name}
                    />
                    <span className="item-quantity-badge">{item.quantity}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="more-items">
                    +{order.items.length - 3} más
                  </div>
                )}
              </div>

              {/* Order Footer */}
              <div className="order-card-footer">
                <div className="order-total">
                  <span>Total:</span>
                  <strong>${parseFloat(order.total).toFixed(2)}</strong>
                </div>
                <Link to={`/orders/${order.id}`} className="view-order-btn">
                  Ver Detalles →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;

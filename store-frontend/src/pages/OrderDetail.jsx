// src/pages/OrderDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { orders as ordersApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

const OrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    fetchOrder();
    fetchTracking();
  }, [orderId, isAuthenticated]);

  const fetchOrder = async () => {
    try {
      const response = await ordersApi.getById(orderId);
      setOrder(response.data);
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTracking = async () => {
    try {
      const response = await ordersApi.getTracking(orderId);
      setTracking(response.data);
    } catch (error) {
      console.error("Error fetching tracking:", error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "#f57c00",
      processing: "#0288d1",
      shipped: "#7b1fa2",
      delivered: "#2e7d32",
      cancelled: "#c62828",
    };
    return colors[status] || "#6b7280";
  };

  if (loading) {
    return (
      <div className="order-detail-loading">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-error">
        <h2>Pedido no encontrado</h2>
        <Link to="/orders" className="btn-primary">
          Volver a Pedidos
        </Link>
      </div>
    );
  }

  return (
    <div className="order-detail-page">
      <div className="order-detail-container">
        {/* Back Link */}
        <Link to="/orders" className="back-link">
          ← Volver a Mis Pedidos
        </Link>

        {/* Order Header */}
        <motion.div
          className="order-detail-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="order-detail-title">Pedido #{order.order_number}</h1>
            <p className="order-detail-date">
              Realizado el{" "}
              {new Date(order.created_at).toLocaleDateString("es-ES", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div
            className="order-detail-status"
            style={{ backgroundColor: getStatusColor(order.status) }}
          >
            {order.status === "pending" && "Pendiente"}
            {order.status === "processing" && "Procesando"}
            {order.status === "shipped" && "Enviado"}
            {order.status === "delivered" && "Entregado"}
            {order.status === "cancelled" && "Cancelado"}
          </div>
        </motion.div>

        <div className="order-detail-content">
          {/* Order Items */}
          <div className="order-detail-main">
            {/* Tracking Timeline */}
            {tracking && tracking.length > 0 && (
              <motion.div
                className="tracking-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <h2 className="section-title">Seguimiento del Pedido</h2>
                <div className="tracking-timeline">
                  {tracking.map((event, index) => (
                    <div key={event.id} className="timeline-item">
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <p className="timeline-status">{event.status}</p>
                        <p className="timeline-description">
                          {event.description}
                        </p>
                        <p className="timeline-date">
                          {new Date(event.created_at).toLocaleString("es-ES")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Order Items */}
            <motion.div
              className="items-section"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="section-title">Artículos</h2>
              <div className="order-detail-items">
                {order.items.map((item) => (
                  <div key={item.id} className="order-detail-item">
                    {item.product ? (
                      <Link
                        to={`/products/${item.product.slug}`}
                        className="item-image-link"
                      >
                        <img src={item.image} alt={item.product_name} />
                      </Link>
                    ) : (
                      <div className="item-image-link">
                        <img
                          src={
                            item.image ||
                            "https://via.placeholder.com/120?text=Product+Unavailable"
                          }
                          alt={item.product_name}
                        />
                      </div>
                    )}

                    <div className="item-info">
                      {item.product ? (
                        <Link
                          to={`/products/${item.product.slug}`}
                          className="item-name"
                        >
                          {item.product_name}
                        </Link>
                      ) : (
                        <span className="item-name">{item.product_name}</span>
                      )}
                      <p className="item-quantity">Cantidad: {item.quantity}</p>
                      <p className="item-price">
                        ${parseFloat(item.product_price).toFixed(2)} c/u
                      </p>
                    </div>
                    <div className="item-subtotal">
                      $
                      {(parseFloat(item.product_price) * item.quantity).toFixed(
                        2
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Order Sidebar */}
          <div className="order-detail-sidebar">
            {/* Shipping Address */}
            <motion.div
              className="detail-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="detail-card-title">Dirección de Envío</h3>
              <div className="address-info">
                <p>
                  {order.first_name} {order.last_name}
                </p>
                <p>{order.address}</p>
                <p>
                  {order.city}, {order.state} {order.postal_code}
                </p>
                <p>{order.country}</p>
                <p className="contact-info">{order.email}</p>
                <p className="contact-info">{order.phone}</p>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              className="detail-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="detail-card-title">Resumen del Pedido</h3>
              <div className="order-summary-details">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>

                {order.discount_amount > 0 && (
                  <div className="summary-row discount">
                    <span>Descuento</span>
                    <span>
                      -${parseFloat(order.discount_amount).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="summary-row">
                  <span>Envío</span>
                  <span>${parseFloat(order.shipping_cost).toFixed(2)}</span>
                </div>

                <div className="summary-row total">
                  <span>Total</span>
                  <span>${parseFloat(order.total).toFixed(2)}</span>
                </div>
              </div>
            </motion.div>

            {/* Payment Info */}
            <motion.div
              className="detail-card"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h3 className="detail-card-title">Información de Pago</h3>
              <div className="payment-info">
                <p>
                  Método:{" "}
                  {order.payment_method === "stripe"
                    ? "Tarjeta"
                    : order.payment_method}
                </p>
                <p>
                  Estado:{" "}
                  {order.payment_status === "paid" ? "Pagado" : "Pendiente"}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;

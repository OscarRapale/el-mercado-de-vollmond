// src/pages/Profile.jsx
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { orders as ordersApi } from "../services/api";

const Profile = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
      });
    }

    fetchRecentOrders();
  }, [isAuthenticated, user, navigate]);

  const fetchRecentOrders = async () => {
    try {
      const response = await ordersApi.getAll();
      const orders = response.data.results || response.data;
      setRecentOrders(orders.slice(0, 3)); // Get 3 most recent
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // TODO: Add API endpoint to update user info
    console.log("Update user:", formData);
    setEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
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
      <div className="profile-loading">
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Profile Header */}
        <motion.div
          className="profile-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="profile-avatar">
            <div className="avatar-circle">
              {user?.first_name?.[0] || user?.username?.[0] || "U"}
            </div>
          </div>
          <div className="profile-header-info">
            <h1>
              {user?.first_name} {user?.last_name}
            </h1>
            <p className="profile-username">@{user?.username}</p>
            <p className="profile-email">{user?.email}</p>
          </div>
        </motion.div>

        {/* Profile Tabs */}
        <motion.div
          className="profile-tabs"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <button
            className={`tab-btn ${activeTab === "info" ? "active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            Información Personal
          </button>
          <button
            className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            onClick={() => setActiveTab("orders")}
          >
            Pedidos Recientes
          </button>
          <button
            className={`tab-btn ${activeTab === "settings" ? "active" : ""}`}
            onClick={() => setActiveTab("settings")}
          >
            Configuración
          </button>
        </motion.div>

        {/* Tab Content */}
        <div className="profile-content">
          {/* Personal Info Tab */}
          {activeTab === "info" && (
            <motion.div
              className="tab-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="info-card">
                <div className="info-card-header">
                  <h2>Información Personal</h2>
                  {!editing ? (
                    <button
                      className="btn-secondary btn-sm"
                      onClick={() => setEditing(true)}
                    >
                      Editar
                    </button>
                  ) : (
                    <button
                      className="btn-text"
                      onClick={() => setEditing(false)}
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {!editing ? (
                  <div className="info-display">
                    <div className="info-item">
                      <label>Nombre Completo</label>
                      <p>
                        {user?.first_name} {user?.last_name}
                      </p>
                    </div>
                    <div className="info-item">
                      <label>Email</label>
                      <p>{user?.email}</p>
                    </div>
                    <div className="info-item">
                      <label>Nombre de Usuario</label>
                      <p>@{user?.username}</p>
                    </div>
                    <div className="info-item">
                      <label>Miembro desde</label>
                      <p>
                        {new Date(user?.date_joined).toLocaleDateString(
                          "es-ES",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="info-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="first_name">Nombre</label>
                        <input
                          type="text"
                          id="first_name"
                          name="first_name"
                          value={formData.first_name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="last_name">Apellido</label>
                        <input
                          type="text"
                          id="last_name"
                          name="last_name"
                          value={formData.last_name}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>

                    <button type="submit" className="btn-primary">
                      Guardar Cambios
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {/* Recent Orders Tab */}
          {activeTab === "orders" && (
            <motion.div
              className="tab-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="info-card">
                <div className="info-card-header">
                  <h2>Pedidos Recientes</h2>
                  <Link to="/orders" className="btn-text">
                    Ver Todos →
                  </Link>
                </div>

                {recentOrders.length > 0 ? (
                  <div className="recent-orders-list">
                    {recentOrders.map((order) => (
                      <Link
                        key={order.id}
                        to={`/orders/${order.id}`}
                        className="order-preview"
                      >
                        <div className="order-preview-header">
                          <div>
                            <h3>Pedido #{order.order_number}</h3>
                            <p className="order-date">
                              {new Date(order.created_at).toLocaleDateString(
                                "es-ES",
                                {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                }
                              )}
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

                        <div className="order-preview-items">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="preview-item-image">
                              <img
                                src={
                                  item.image ||
                                  "https://via.placeholder.com/60?text=N/A"
                                }
                                alt={item.product_name}
                              />
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="more-items-badge">
                              +{order.items.length - 3}
                            </div>
                          )}
                        </div>

                        <div className="order-preview-footer">
                          <span className="order-total">
                            ${parseFloat(order.total).toFixed(2)}
                          </span>
                          <span className="view-arrow">Ver Detalles →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="no-orders">
                    <p>No tienes pedidos recientes</p>
                    <Link to="/products" className="btn-primary">
                      Explorar Productos
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <motion.div
              className="tab-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="info-card">
                <h2>Configuración de Cuenta</h2>

                <div className="settings-section">
                  <h3>Seguridad</h3>
                  <div className="settings-item">
                    <div className="settings-item-info">
                      <h4>Cambiar Contraseña</h4>
                      <p>Actualiza tu contraseña regularmente</p>
                    </div>
                    <button className="btn-secondary btn-sm">Cambiar</button>
                  </div>
                </div>

                <div className="settings-section">
                  <h3>Notificaciones</h3>
                  <div className="settings-item">
                    <div className="settings-item-info">
                      <h4>Email de Pedidos</h4>
                      <p>Recibe actualizaciones sobre tus pedidos</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <div className="settings-item">
                    <div className="settings-item-info">
                      <h4>Newsletter</h4>
                      <p>Recibe noticias y ofertas especiales</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" defaultChecked />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>

                <div className="settings-section danger-zone">
                  <h3>Zona Peligrosa</h3>
                  <div className="settings-item">
                    <div className="settings-item-info">
                      <h4>Cerrar Sesión</h4>
                      <p>Cierra sesión en este dispositivo</p>
                    </div>
                    <button
                      className="btn-secondary btn-sm"
                      onClick={handleLogout}
                    >
                      Cerrar Sesión
                    </button>
                  </div>

                  <div className="settings-item">
                    <div className="settings-item-info">
                      <h4>Eliminar Cuenta</h4>
                      <p className="danger-text">
                        Esta acción es permanente y no se puede deshacer
                      </p>
                    </div>
                    <button className="btn-danger btn-sm">Eliminar</button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;

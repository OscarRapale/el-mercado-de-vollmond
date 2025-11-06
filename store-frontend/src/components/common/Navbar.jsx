import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { categories, products } from "../../services/api";

const Navbar = () => {
  const [showProductMenu, setShowProductMenu] = useState(false);
  const [categoriesList, setCategoriesList] = useState([]);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [categoryProducts, setCategoryProducts] = useState([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, logout } = useAuth();
  const { cartItemCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchCategories = async () => {
  try {
    const response = await categories.getAll();
    // Handle both array and paginated response
    setCategoriesList(response.data.results || response.data);
  } catch (error) {
    console.error("error fetching categories:", error);
    setCategoriesList([]); // Changed from setCategoryProducts to setCategoriesList
  }
};

  const fetchCategoryProducts = async (categorySlug) => {
    try {
      const response = await products.getAll({ category: categorySlug });
      setCategoryProducts(response.data.results || response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setCategoryProducts([]);
    }
  };

  const handleCategoryHover = (category) => {
    setHoveredCategory(category);
    if (category) {
      fetchCategoryProducts(category.slug);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className={`navbar ${isScrolled ? "navbar-scrolled" : ""}`}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <h1 className="logo-text">
            <span className="logo-main">El Mercado de Vollmond</span>
          </h1>
        </Link>
        <div className="navbar-center">
          <div
            className="navbar-item navbar-dropdown"
            onMouseEnter={() => setShowProductMenu(true)}
            onMouseLeave={() => {
              setShowProductMenu(false);
              setHoveredCategory(null);
            }}
          >
            <button className="navbar-link">Products</button>

            {/* Mega Menu */}
            {showProductMenu && (
              <div className="mega-menu">
                <div className="mega-menu-grid">
                  <div className="categories-list">
                    <h3 className="menu-section-title">Browse by Category</h3>
                    {categoriesList.map((category) => (
                      <Link
                        key={category.id}
                        to={`/products?category=${category.slug}`}
                        className={`category-link ${
                          hoveredCategory?.id === category.id ? "active" : ""
                        }`}
                        onMouseEnter={() => handleCategoryHover(category)}
                        onClick={() => setShowProductMenu(false)}
                      >
                        <span className="category-name">{category.name}</span>
                        <span className="category-arrow">→</span>
                      </Link>
                    ))}

                    <Link
                      to="/products"
                      className="view-all-link"
                      onClick={() => setShowProductMenu(false)}
                    >
                      View All Products
                    </Link>
                  </div>

                  {/* Image Preview */}
                  <div className="preview-area">
                    {hoveredCategory && categoryProducts.length > 0 ? (
                      <>
                        <div className="preview-image">
                          <img
                            src={categoryProducts[0].image}
                            alt={categoryProducts[0].name}
                          />
                          <div className="preview-overlay">
                            <h4>{categoryProducts[0].name}</h4>
                          </div>
                        </div>
                        <p className="preview-description">
                          {hoveredCategory.description ||
                            `Discover our ${hoveredCategory.name.toLowerCase()} collection`}
                        </p>
                      </>
                    ) : (
                      <div className="preview-placeholder">
                        <p>Hover over a category to preview</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link to="/about" className="navbar-link">
            About
          </Link>

          {isAuthenticated && (
            <Link to="/orders" className="navbar-link">
              Orders
            </Link>
          )}
        </div>

        {/* Right Icons */}
        <div className="navbar-right">
          {/* User Menu */}
          {isAuthenticated ? (
            <div className="navbar-dropdown">
              <button className="navbar-icon-btn">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z"
                    fill="currentColor"
                  />
                  <path
                    d="M10 12C4.47715 12 0 15.3579 0 19.5C0 19.7761 0.223858 20 0.5 20H19.5C19.7761 20 20 19.7761 20 19.5C20 15.3579 15.5228 12 10 12Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
              <div className="dropdown-menu">
                <Link to="/profile" className="dropdown-item">
                  Profile
                </Link>
                <Link to="/orders" className="dropdown-item">
                  My Orders
                </Link>
                <button onClick={handleLogout} className="dropdown-item">
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="navbar-icon-btn">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 10C12.7614 10 15 7.76142 15 5C15 2.23858 12.7614 0 10 0C7.23858 0 5 2.23858 5 5C5 7.76142 7.23858 10 10 10Z"
                  fill="currentColor"
                />
                <path
                  d="M10 12C4.47715 12 0 15.3579 0 19.5C0 19.7761 0.223858 20 0.5 20H19.5C19.7761 20 20 19.7761 20 19.5C20 15.3579 15.5228 12 10 12Z"
                  fill="currentColor"
                />
              </svg>
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="navbar-icon-btn navbar-cart">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M6 16C4.9 16 4.01 16.9 4.01 18C4.01 19.1 4.9 20 6 20C7.1 20 8 19.1 8 18C8 16.9 7.1 16 6 16ZM0 0V2H2L5.6 9.59L4.25 12.04C4.09 12.32 4 12.65 4 13C4 14.1 4.9 15 6 15H18V13H6.42C6.28 13 6.17 12.89 6.17 12.75L6.2 12.63L7.1 11H14.55C15.3 11 15.96 10.59 16.3 9.97L19.88 3.48C19.96 3.34 20 3.17 20 3C20 2.45 19.55 2 19 2H4.21L3.27 0H0ZM16 16C14.9 16 14.01 16.9 14.01 18C14.01 19.1 14.9 20 16 20C17.1 20 18 19.1 18 18C18 16.9 17.1 16 16 16Z"
                fill="currentColor"
              />
            </svg>
            {cartItemCount > 0 && (
              <span className="cart-badge">{cartItemCount}</span>
            )}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

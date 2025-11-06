// src/App.jsx
import React from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/common/Navbar";

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <div className="App">
            <Navbar />

            {/* Main content */}
            <main style={{ paddingTop: "80px" }}>
              <div className="container">
                <h1
                  className="heading-gold text-center"
                  style={{ marginTop: "2rem" }}
                >
                  Author Store
                </h1>
                <p className="text-center">Dark Fantasy E-commerce</p>

                {/* Test buttons */}
                <div style={{ textAlign: "center", marginTop: "2rem" }}>
                  <button className="btn btn-primary">Primary Button</button>
                  <button
                    className="btn btn-secondary"
                    style={{ marginLeft: "1rem" }}
                  >
                    Secondary Button
                  </button>
                  <button
                    className="btn btn-gold"
                    style={{ marginLeft: "1rem" }}
                  >
                    Gold Button
                  </button>
                </div>
              </div>
            </main>
          </div>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

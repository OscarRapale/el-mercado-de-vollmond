// src/components/checkout/CheckoutSteps.jsx
import React from "react";
import { motion } from "framer-motion";

const CheckoutSteps = ({ currentStep }) => {
  const steps = [
    { number: 1, label: "Envío" },
    { number: 2, label: "Pago" },
    { number: 3, label: "Confirmación" },
  ];

  return (
    <div className="checkout-steps">
      {steps.map((step, index) => (
        <div key={step.number} className="step-item">
          <div className="step-indicator">
            <motion.div
              className={`step-circle ${
                currentStep >= step.number ? "active" : ""
              } ${currentStep > step.number ? "completed" : ""}`}
              initial={{ scale: 0.8 }}
              animate={{ scale: currentStep >= step.number ? 1 : 0.8 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep > step.number ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M13.3333 4L6 11.3333L2.66667 8"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                step.number
              )}
            </motion.div>

            {index < steps.length - 1 && (
              <div
                className={`step-line ${
                  currentStep > step.number ? "completed" : ""
                }`}
              />
            )}
          </div>

          <span
            className={`step-label ${
              currentStep >= step.number ? "active" : ""
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CheckoutSteps;

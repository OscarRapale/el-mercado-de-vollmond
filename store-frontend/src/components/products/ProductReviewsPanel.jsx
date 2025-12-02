// src/components/products/ProductReviewsPanel.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  products as productsApi,
  reviews as reviewsApi,
} from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const ProductReviewsPanel = ({ product, onClose, onReviewSubmitted }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated } = useAuth();

  const fetchReviews = useCallback(async () => {
    try {
      const response = await productsApi.getReviews(product.slug);
      setReviews(response.data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [product.slug]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      alert("Please login to submit a review");
      return;
    }

    setSubmitting(true);
    try {
      await reviewsApi.create({
        product: product.id,
        rating: formData.rating,
        comment: formData.comment,
      });

      // Reset form
      setFormData({ rating: 5, comment: "" });
      setShowForm(false);

      // Refresh reviews and product data
      await fetchReviews();
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      alert(error.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const panelVariants = {
    hidden: { x: "100%" },
    visible: {
      x: 0,
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
      },
    },
    exit: {
      x: "100%",
      transition: {
        type: "spring",
        damping: 30,
        stiffness: 300,
      },
    },
  };

  return (
    <motion.div
      className="sliding-panel"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Close Button */}
      <button className="panel-close-btn" onClick={onClose}>
        CLOSE <span className="close-x">✕</span>
      </button>

      {/* Panel Content */}
      <div className="panel-content">
        <div className="panel-header">
          <h2 className="panel-title">Reviews</h2>

          {isAuthenticated && !showForm && (
            <button
              className="btn-secondary btn-sm"
              onClick={() => setShowForm(true)}
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Review Form */}
        {showForm && (
          <motion.div
            className="review-form-container"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <form onSubmit={handleSubmit} className="review-form">
              <h3>Write Your Review</h3>

              {/* Rating */}
              <div className="form-group">
                <label>Rating</label>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${
                        star <= formData.rating ? "active" : ""
                      }`}
                      onClick={() => setFormData({ ...formData, rating: star })}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment */}
              <div className="form-group">
                <label>Your Review</label>
                <textarea
                  value={formData.comment}
                  onChange={(e) =>
                    setFormData({ ...formData, comment: e.target.value })
                  }
                  placeholder="Share your thoughts about this product..."
                  required
                  rows="5"
                />
              </div>

              {/* Actions */}
              <div className="form-actions">
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Reviews List */}
        <div className="reviews-list">
          {loading ? (
            <p>Loading reviews...</p>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-header">
                  <div className="review-author">
                    <strong>
                      {review.user.first_name || review.user.username}
                    </strong>
                    <span className="review-date">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="review-rating">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                </div>
                <p className="review-comment">{review.comment}</p>
              </div>
            ))
          ) : (
            <p className="no-reviews">
              No reviews yet. Be the first to review this product!
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductReviewsPanel;

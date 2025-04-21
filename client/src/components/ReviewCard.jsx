import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import "../styles/ReviewCard.css";
import {
  fetchDeleteWithAuth,
  fetchPutWithAuth,
} from "../security/fetchWithAuth";

const ReviewCard = ({ review, isOwner, onReviewDeleted, onReviewUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editRating, setEditRating] = useState(review.rating);
  const [editReviewText, setEditReviewText] = useState(
    review.review_text || ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      // Simplified endpoint using just review_id
      await fetchDeleteWithAuth(
        `${API_URL}/reviews/${review.review_id}/delete`
      );

      if (onReviewDeleted) {
        onReviewDeleted(review.review_id);
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review. Please try again.");
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditRating(review.rating);
    setEditReviewText(review.review_text || "");
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    setIsSubmitting(true);

    try {
      const updatedReview = await fetchPutWithAuth(
        `${API_URL}/reviews/${review.review_id}/update`,
        {
          rating: editRating,
          review_text: editReviewText,
        }
      );

      setIsEditing(false);
      setIsSubmitting(false);

      if (onReviewUpdated) {
        onReviewUpdated(updatedReview);
      }
    } catch (error) {
      console.error("Error updating review:", error);
      setIsSubmitting(false);
      alert("Failed to update review. Please try again.");
    }
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <h3>{review.User?.username || "Anonymous"}</h3>

        {isEditing ? (
          <div className="edit-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className="star-icon"
                color={star <= editRating ? "#f5c518" : "#e4e5e9"}
                onClick={() => setEditRating(star)}
                style={{ cursor: "pointer" }}
              />
            ))}
          </div>
        ) : (
          <div className="review-rating">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                color={i < review.rating ? "#f5c518" : "#e4e5e9"}
              />
            ))}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="edit-review-form">
          <textarea
            value={editReviewText}
            onChange={(e) => setEditReviewText(e.target.value)}
            rows={5}
            placeholder="Write your review..."
            className="edit-review-textarea"
          />

          <div className="edit-actions">
            <button
              className="cancel-edit-btn"
              onClick={handleCancelEdit}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              className="save-edit-btn"
              onClick={handleSaveEdit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ) : (
        <p className="review-content">{review.review_text}</p>
      )}

      {isOwner && !isEditing && (
        <div className="review-actions">
          <button className="edit-review-btn" onClick={handleEdit}>
            Edit
          </button>
          <button className="delete-review-btn" onClick={handleDelete}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;

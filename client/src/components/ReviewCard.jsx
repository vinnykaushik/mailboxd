import React from "react";
import { Link } from "react-router-dom";
import { FaStar, FaEdit } from "react-icons/fa";
import "../styles/ReviewCard.css";

const ReviewCard = ({ review, isOwner }) => {
  return (
    <div className="review-card">
      <div className="review-header">
        <h3>{review.User?.username || "Anonymous"}</h3>
        <div className="review-rating">
          {[...Array(5)].map((_, i) => (
            <FaStar key={i} color={i < review.rating ? "#f5c518" : "#e4e5e9"} />
          ))}
        </div>
      </div>
      <p className="review-content">{review.review_text}</p>
      {isOwner && (
        <div className="review-actions">
          <Link
            to={`/reviews/${review.review_id}/edit`}
            className="edit-review-btn"
          >
            Edit
          </Link>
          <button className="delete-review-btn">Delete</button>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;

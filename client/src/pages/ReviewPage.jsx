import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { useAuthUser } from "../security/AuthContext";
import {
  fetchWithAuth,
  fetchGetWithAuth,
  fetchPostWithAuth,
} from "../security/fetchWithAuth";
import Navbar from "../components/Navbar";
import "../styles/ReviewPage.css";

const ReviewPage = () => {
  const { id: filmId, reviewId } = useParams();
  const { isAuthenticated, user } = useAuthUser();
  const navigate = useNavigate();

  const [film, setFilm] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const filmResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${filmId}?api_key=${TMDB_API_KEY}&language=en-US`
        );
        const filmData = await filmResponse.json();
        setFilm(filmData);

        if (reviewId) {
          setIsEditing(true);
          try {
            const reviewResponse = await fetchGetWithAuth(
              `${API_URL}/reviews/${reviewId}`
            );

            if (reviewResponse.user_id !== user?.id) {
              navigate(`/films/${filmId}`);
              return;
            }

            setRating(reviewResponse.rating || 0);
            setReviewText(reviewResponse.review_text || "");
          } catch (error) {
            console.error("Error fetching review", error);
            navigate(`/films/${filmId}`);
          }
        }
      } catch (error) {
        console.error("Error fetching data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    filmId,
    reviewId,
    isAuthenticated,
    user,
    navigate,
    TMDB_API_KEY,
    API_URL,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) return;

    try {
      const reviewData = {
        movie_id: parseInt(filmId),
        rating,
        review_text: reviewText,
        tmdbMovieData: film,
      };

      if (isEditing) {
        await fetchPostWithAuth(`${API_URL}/reviews/${reviewId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(reviewData),
        });
      } else {
        await fetchPostWithAuth(`${API_URL}/reviews`, reviewData);
      }

      navigate(`/films/${filmId}`);
    } catch (error) {
      console.error("Error saving review", error);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !reviewId) return;

    if (window.confirm("Are you sure you want to delete this review?")) {
      try {
        await fetchWithAuth(`${API_URL}/reviews/${reviewId}`, {
          method: "DELETE",
        });
        navigate(`/films/${filmId}`);
      } catch (error) {
        console.error("Error deleting review", error);
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!film) return <div className="error">Film not found</div>;

  return (
    <div className="review-page">
      <Navbar />

      <div className="review-container">
        <div className="film-header">
          <img
            className="poster-thumbnail"
            src={
              film.poster_path
                ? `https://image.tmdb.org/t/p/w200${film.poster_path}`
                : "/placeholder-poster.jpg"
            }
            alt={film.title}
          />
          <div className="film-info">
            <h1 className="film-title">
              {film.title}{" "}
              <span className="film-year">
                ({film.release_date?.split("-")[0]})
              </span>
            </h1>
            <p className="review-by">
              Review by {user?.username || user?.first_name}
            </p>
          </div>
        </div>

        <form className="review-form" onSubmit={handleSubmit}>
          <div className="rating-container">
            <h3>Your Rating</h3>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`star-icon ${
                    rating >= star ? "star-active" : "star-inactive"
                  }`}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>

          <div className="content-container">
            <h3>Your Review</h3>
            <textarea
              className="content-textarea"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Share your thoughts on this film..."
            />
          </div>

          <div className="buttons-container">
            {isEditing && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Delete Review
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/films/${filmId}`)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditing ? "Update Review" : "Post Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewPage;

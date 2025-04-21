import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaStar,
  FaHeart,
  FaRegStar,
  FaRegHeart,
  FaPencilAlt,
} from "react-icons/fa";
import { useAuthUser } from "../security/AuthContext";
import { fetchGetWithAuth, fetchPostWithAuth } from "../security/fetchWithAuth";
import ReviewCard from "../components/ReviewCard";
import "../styles/FilmPage.css";
import Navbar from "../components/Navbar";

const FilmPage = () => {
  const { id: filmId } = useParams();
  const { isAuthenticated, user } = useAuthUser();

  const [film, setFilm] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [showRatingInput, setShowRatingInput] = useState(false);
  const [error, setError] = useState(null);

  const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchFilmData = async () => {
      try {
        // Public data that doesn't require authentication
        const filmResponse = await fetch(
          `https://api.themoviedb.org/3/movie/${filmId}?api_key=${TMDB_API_KEY}&language=en-US`
        );

        if (!filmResponse.ok) {
          throw new Error(`Failed to fetch film data: ${filmResponse.status}`);
        }

        const filmData = await filmResponse.json();
        setFilm(filmData);

        try {
          const reviewsResponse = await fetch(
            `${API_URL}/movies/${filmId}/reviews`
          );
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json();
            setReviews(reviewsData || []);
          }
        } catch (error) {
          console.error("Error fetching reviews", error);
          setReviews([]);
        }

        // Only attempt authenticated requests if user is definitely logged in
        // and user object exists with an id property
        if (isAuthenticated && user && user.id) {
          try {
            const userReviewResponse = await fetchGetWithAuth(
              `${API_URL}/users/${user.id}/movies/${filmId}/reviews`
            );

            if (userReviewResponse && userReviewResponse.length > 0) {
              setUserRating(userReviewResponse[0].rating || 0);
            }

            const watchlistResponse = await fetchGetWithAuth(
              `${API_URL}/users/${user.id}/watchlist`
            );

            if (watchlistResponse) {
              const watchlistItems = Array.isArray(watchlistResponse)
                ? watchlistResponse
                : [watchlistResponse];

              if (watchlistItems.length > 0) {
                const isInWatchlist = watchlistItems.some((item) => {
                  if (item.movie_ids && Array.isArray(item.movie_ids)) {
                    return item.movie_ids.includes(parseInt(filmId));
                  }
                  return item.movie_id === parseInt(filmId);
                });

                setIsWatchlisted(isInWatchlist);
              }
            }
          } catch (error) {
            console.error("Error fetching user interactions", error);
            // Don't let authentication errors affect the main film display
          }
        }
      } catch (error) {
        console.error("Error fetching film details", error);
        setError("Failed to load film details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFilmData();
  }, [filmId, isAuthenticated, user, TMDB_API_KEY, API_URL]);

  const handleRating = async (rating) => {
    if (!isAuthenticated) return;

    try {
      await fetchPostWithAuth(`${API_URL}/reviews`, {
        movie_id: parseInt(filmId),
        rating,
        review_text: "",
      });
      setUserRating(rating);
      setShowRatingInput(false);

      const reviewsResponse = await fetch(
        `${API_URL}/movies/${filmId}/reviews`
      );
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);
      }
    } catch (error) {
      console.error("Error rating movie", error);
    }
  };

  const handleWatchlist = async () => {
    if (!isAuthenticated) return;

    try {
      if (isWatchlisted) {
        await fetchPostWithAuth(`${API_URL}/remove-from-watchlist`, {
          movieId: parseInt(filmId),
        });
        setIsWatchlisted(false);
      } else {
        await fetchPostWithAuth(`${API_URL}/add-to-watchlist`, {
          movieId: parseInt(filmId),
        });
        setIsWatchlisted(true);
      }
    } catch (error) {
      console.error("Error updating watchlist", error);
    }
  };

  if (loading) {
    return <div className="loading-container">Loading...</div>;
  }

  if (!film) {
    return <div className="error-container">Film not found</div>;
  }
  console.log(film);
  return (
    <div className="page-container">
      <Navbar />
      <div className="backdrop-container">
        <div
          className="backdrop"
          style={{
            backgroundImage: `url(https://image.tmdb.org/t/p/original${film.backdrop_path})`,
          }}
        />
      </div>

      <div className="film-details">
        <div>
          <img
            className="poster"
            src={
              film.poster_path
                ? `https://image.tmdb.org/t/p/w500${film.poster_path}`
                : "/placeholder-poster.jpg"
            }
            alt={film.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder-poster.jpg";
            }}
          />
        </div>

        <div className="film-info">
          <h1 className="title">
            {film.title}
            <span className="year">({film.release_date?.split("-")[0]})</span>
          </h1>

          {film.tagline && <p className="tagline">{film.tagline}</p>}

          <div className="stats">
            <div className="stat">
              <FaStar color="#f5c518" />
              <span>{film.vote_average?.toFixed(1)} / 10</span>
            </div>
          </div>

          <p className="overview">{film.overview}</p>

          {isAuthenticated && (
            <>
              {showRatingInput ? (
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={`star-icon ${
                        userRating >= star ? "star-active" : "star-inactive"
                      }`}
                      onClick={() => handleRating(star)}
                    />
                  ))}
                </div>
              ) : (
                <div className="user-actions">
                  <button
                    onClick={() => setShowRatingInput(true)}
                    className="btn btn-secondary"
                  >
                    <FaRegStar /> {userRating > 0 ? "Rated" : "Rate"}
                  </button>

                  <button
                    onClick={handleWatchlist}
                    className="btn btn-secondary"
                  >
                    {isWatchlisted ? (
                      <FaHeart color="#ff6b6b" />
                    ) : (
                      <FaRegHeart />
                    )}
                    {isWatchlisted ? "Watchlisted" : "Watchlist"}
                  </button>

                  <Link
                    to={`/films/${filmId}/review`}
                    className="btn btn-primary"
                  >
                    <FaPencilAlt /> Review
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="reviews-section">
        <h2 className="reviews-header">Reviews</h2>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard
              key={review.review_id}
              review={review}
              isOwner={user?.id === review.user_id}
            />
          ))
        ) : (
          <p>No reviews yet. Be the first to review!</p>
        )}
      </div>
    </div>
  );
};

export default FilmPage;

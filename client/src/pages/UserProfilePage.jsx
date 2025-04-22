import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import { fetchGetWithAuth } from "../security/fetchWithAuth";
import Navbar from "../components/Navbar";
import FilmCarousel from "../components/FilmCarousel";
import "../styles/UserProfilePage.css";

const UserProfilePage = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewedFilms, setReviewedFilms] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [watchlistFilms, setWatchlistFilms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user details
        const userData = await fetchGetWithAuth(`${API_URL}/users/${userId}`);
        if (!userData) {
          throw new Error("User not found");
        }
        setUser(userData);

        // Fetch user reviews
        const reviewsResponse = await fetch(
          `${API_URL}/users/${userId}/reviews`
        );
        if (!reviewsResponse.ok) {
          throw new Error("Failed to fetch reviews");
        }
        const reviewsData = await reviewsResponse.json();
        setReviews(reviewsData);

        // Fetch films for reviews
        const reviewedFilmsData = await Promise.all(
          reviewsData.map(async (review) => {
            const filmResponse = await fetch(
              `https://api.themoviedb.org/3/movie/${review.movie_id}?api_key=${TMDB_API_KEY}&language=en-US`
            );
            if (!filmResponse.ok) {
              return null;
            }
            const filmData = await filmResponse.json();
            return {
              ...filmData,
              userRating: review.rating,
              reviewId: review.review_id,
              reviewDate: review.created_at || review.updated_at || new Date(),
            };
          })
        );

        // Filter out any failed film fetches
        const validReviewedFilms = reviewedFilmsData.filter(
          (film) => film !== null
        );

        // Sort by most recently reviewed
        const sortedReviewedFilms = validReviewedFilms.sort(
          (a, b) => new Date(b.reviewDate) - new Date(a.reviewDate)
        );

        setReviewedFilms(sortedReviewedFilms);

        // Fetch user watchlist
        const watchlistResponse = await fetchGetWithAuth(
          `${API_URL}/users/${userId}/watchlist`
        );
        if (watchlistResponse && watchlistResponse.length > 0) {
          const watchlistItems = Array.isArray(watchlistResponse)
            ? watchlistResponse[0]
            : watchlistResponse;

          setWatchlist(watchlistItems);

          // Fetch films for watchlist
          if (watchlistItems.movie_ids && watchlistItems.movie_ids.length > 0) {
            const watchlistFilmsData = await Promise.all(
              watchlistItems.movie_ids.map(async (movieId) => {
                const filmResponse = await fetch(
                  `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`
                );
                if (!filmResponse.ok) {
                  return null;
                }
                return filmResponse.json();
              })
            );

            // Filter out any failed film fetches
            const validWatchlistFilms = watchlistFilmsData.filter(
              (film) => film !== null
            );
            setWatchlistFilms(validWatchlistFilms);
          }
        }
      } catch (error) {
        console.error("Error fetching user profile data:", error);
        setError(error.message || "Failed to load user profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, API_URL, TMDB_API_KEY]);

  if (loading) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="loading-container">Loading profile data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <Navbar />
        <div className="error-container">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Navbar />

      <div className="profile-container">
        <div className="profile-header">
          <h1 className="username">{user.username}</h1>
          <p className="stats">
            <span className="films-count">
              {reviewedFilms.length}{" "}
              {reviewedFilms.length > 1 ? "films" : "film"}
            </span>{" "}
            reviewed
          </p>
        </div>

        {watchlistFilms.length > 0 && (
          <div className="watchlist-section">
            <h2 className="section-title">Watchlist</h2>
            <div className="films-grid">
              {watchlistFilms.map((film) => (
                <div key={film.id} className="film-card">
                  <Link to={`/films/${film.id}`} className="film-link">
                    <div className="poster-container">
                      <img
                        src={
                          film.poster_path
                            ? `https://image.tmdb.org/t/p/w300${film.poster_path}`
                            : "/placeholder-poster.jpg"
                        }
                        alt={film.title}
                        className="film-poster"
                      />
                    </div>
                    <h3 className="film-title">{film.title}</h3>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="reviewed-films-section">
          <h2 className="section-title">Films Reviewed</h2>

          {reviewedFilms.length === 0 ? (
            <p className="no-films">No films reviewed yet.</p>
          ) : (
            <div className="films-grid">
              {reviewedFilms.map((film) => (
                <div key={film.id} className="film-card">
                  <Link to={`/films/${film.id}`} className="film-link">
                    <div className="poster-container">
                      <img
                        src={
                          film.poster_path
                            ? `https://image.tmdb.org/t/p/w300${film.poster_path}`
                            : "/placeholder-poster.jpg"
                        }
                        alt={film.title}
                        className="film-poster"
                      />
                      <div className="film-rating">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            className={
                              i < film.userRating ? "star-filled" : "star-empty"
                            }
                          />
                        ))}
                      </div>
                    </div>
                    <h3 className="film-title">{film.title}</h3>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;

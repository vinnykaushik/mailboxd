import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import "../styles/SearchPage.css";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const SearchPage = () => {
  const query = useQuery().get("query");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) return;

      setLoading(true);
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${query}&page=${currentPage}`
        );

        const data = await response.json();
        setSearchResults(data.results);
        setTotalPages(data.total_pages);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, currentPage, TMDB_API_KEY]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo(0, 0);
  };

  return (
    <div className="search-page">
      <Navbar />

      <div className="search-container">
        <h1 className="search-title">Search Results for "{query}"</h1>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : searchResults.length === 0 ? (
          <div className="no-results">No movies found matching "{query}"</div>
        ) : (
          <>
            <div className="search-results">
              {searchResults.map((movie) => (
                <Link
                  to={`/films/${movie.id}`}
                  key={movie.id}
                  className="movie-card"
                >
                  <div className="movie-poster">
                    {movie.poster_path ? (
                      <img
                        src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                        alt={movie.title}
                      />
                    ) : (
                      <div className="no-poster">No poster available</div>
                    )}
                  </div>
                  <div className="movie-info">
                    <h3 className="movie-title">{movie.title}</h3>
                    <p className="movie-year">
                      {movie.release_date
                        ? movie.release_date.split("-")[0]
                        : "Unknown year"}
                    </p>
                    {movie.overview && (
                      <p className="movie-overview">
                        {movie.overview.length > 200
                          ? `${movie.overview.substring(0, 200)}...`
                          : movie.overview}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="page-button"
                >
                  Previous
                </button>

                <span className="page-info">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="page-button"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;

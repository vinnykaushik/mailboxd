import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/FilmCarousel.css";

const FilmCarousel = ({ title, endpoint }) => {
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);

  const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
  const TMDB_BASE_URL = "https://api.themoviedb.org/3";

  useEffect(() => {
    const fetchFilms = async () => {
      try {
        let url;

        switch (endpoint) {
          case "popular":
            url = `${TMDB_BASE_URL}/movie/popular`;
            break;
          case "top_rated":
            url = `${TMDB_BASE_URL}/movie/top_rated`;
            break;
          case "upcoming":
            url = `${TMDB_BASE_URL}/movie/upcoming`;
            break;
          case "now_playing":
            url = `${TMDB_BASE_URL}/movie/now_playing`;
            break;
          default:
            url = `${TMDB_BASE_URL}/movie/popular`;
        }

        const response = await fetch(
          `${url}?api_key=${TMDB_API_KEY}&language=en-US&page=1`
        );
        const data = await response.json();
        setFilms(data.results);
      } catch (error) {
        console.error("Error fetching films:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilms();
  }, [endpoint, TMDB_API_KEY]);

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 6,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 4,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 2,
        },
      },
    ],
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="carousel-container">
      <h2 className="carousel-title">{title}</h2>
      <Slider {...settings}>
        {films.map((film) => (
          <div key={film.id} className="film-card">
            <Link to={`/films/${film.id}`}>
              <div className="poster-container">
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
                <div className="carousel-film-info">
                  <h3 className="carousel-film-title">{film.title}</h3>
                  <span className="carousel-film-year">
                    {film.release_date?.split("-")[0] || "Unknown"}
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default FilmCarousel;

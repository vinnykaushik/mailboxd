import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuthUser } from "../security/AuthContext";
import Navbar from "./Navbar";
import FilmCarousel from "./FilmCarousel";
import "../styles/Home.css";

export default function Home() {
  const { isAuthenticated, user } = useAuthUser();
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <Navbar />

      <div className="hero">
        <h1 className="hero-title">Track films you've watched.</h1>
        <p className="hero-subtitle">
          Save those you want to see. Tell your friends what's good.
        </p>

        {!isAuthenticated && (
          <div className="hero-cta">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/register")}
            >
              Get Started – It's Free!
            </button>
            <p className="sign-in-prompt">
              Already have an account?{" "}
              <button onClick={() => navigate("/login")} className="text-link">
                Sign in
              </button>
            </p>
          </div>
        )}
      </div>

      <div className="carousels-section">
        <FilmCarousel title="Popular Films" endpoint="popular" />
        <FilmCarousel title="Now Playing" endpoint="now_playing" />
        <FilmCarousel title="Top Rated" endpoint="top_rated" />
        <FilmCarousel title="Upcoming" endpoint="upcoming" />
      </div>
    </div>
  );
}

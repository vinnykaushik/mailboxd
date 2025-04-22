import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaUserCircle, FaBars, FaTimes } from "react-icons/fa";
import { useAuthUser } from "../security/AuthContext";
import "../styles/Navbar.css";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuthUser();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="nav-container">
      <Link to="/" className="logo">
        MAILBOXD
      </Link>

      <div className="hamburger-menu" onClick={toggleMobileMenu}>
        {mobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </div>

      <div className={`nav-content ${mobileMenuOpen ? "active" : ""}`}>
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            className="search-input"
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>

        {isAuthenticated ? (
          <div className="user-menu">
            <div className="avatar">
              <FaUserCircle size={24} />
              <Link
                to={`/users/${user?.id}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {user?.username || user?.first_name}
              </Link>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary">
              Log out
            </button>
          </div>
        ) : (
          <div className="nav-links">
            <Link
              to="/login"
              className="nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Create Account
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

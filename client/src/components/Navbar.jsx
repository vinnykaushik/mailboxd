import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaSearch, FaUserCircle } from "react-icons/fa";
import { useAuthUser } from "../security/AuthContext";
import "../styles/Navbar.css";

const Navbar = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const { isAuthenticated, user, logout } = useAuthUser();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav className="nav-container">
      <Link to="/" className="logo">
        MAILBOXD
      </Link>

      <div className="nav-links">
        <Link to="/films" className="nav-link">
          Films
        </Link>
        <Link to="/reviews" className="nav-link">
          Reviews
        </Link>
        <Link to="/lists" className="nav-link">
          Lists
        </Link>
        <Link to="/members" className="nav-link">
          Members
        </Link>
      </div>

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
            <span>{user?.username || user?.first_name}</span>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary">
            Log out
          </button>
        </div>
      ) : (
        <div className="nav-links">
          <Link to="/login" className="nav-link">
            Sign In
          </Link>
          <Link to="/register" className="nav-link">
            Create Account
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

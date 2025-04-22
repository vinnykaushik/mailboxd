import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import FilmPage from "./pages/FilmPage";
import ReviewPage from "./pages/ReviewPage";
import SearchPage from "./pages/SearchPage";
import RequireAuth from "./security/RequireAuth";
import UserProfilePage from "./pages/UserProfilePage";
import { AuthProvider } from "./security/AuthContext";
import * as ReactDomClient from "react-dom/client";
import "./styles/App.css";

const container = document.getElementById("root");
const root = ReactDomClient.createRoot(container);

root.render(
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/films/:id" element={<FilmPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route
          path="/films/:id/review"
          element={
            <RequireAuth>
              <ReviewPage />
            </RequireAuth>
          }
        />
        <Route
          path="/films/:id/review/:reviewId"
          element={
            <RequireAuth>
              <ReviewPage />
            </RequireAuth>
          }
        />
        <Route path="/users/:userId" element={<UserProfilePage />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

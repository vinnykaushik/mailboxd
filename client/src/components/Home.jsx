import { useAuthUser } from "../security/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { isAuthenticated, user } = useAuthUser();
  const navigate = useNavigate();

  return (
    <div>
      <h1>Mailboxd</h1>
      <div>
        {!isAuthenticated ? (
          <div>
            <p>Welcome to Mailboxd! Log in or register to track your films!</p>
            <button className="btn-primary" onClick={() => navigate("/login")}>
              Login
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate("/register")}
            >
              Create Account
            </button>
          </div>
        ) : (
          <p>Welcome back, {user?.firstName}! You are logged in.</p>
        )}
      </div>
    </div>
  );
}

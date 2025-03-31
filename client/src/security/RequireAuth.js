import { Navigate } from "react-router-dom";
import { useAuthUser } from "./AuthContext";

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useAuthUser();

  if (loading) {
    return <p>... loading</p>;
  }

  if (!loading && !isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return children;
}

export default RequireAuth;

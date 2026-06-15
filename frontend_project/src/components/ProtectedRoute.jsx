import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const auth = sessionStorage.getItem("auth");

  if (!auth) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;
import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@/data/userStore";

// Auth screens
import LoginScreen from "@/screens/LoginScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";

// App screens
import Layout from "@/components/Layout";
import HomeScreen from "@/screens/HomeScreen";
import BrowseScreen from "@/screens/BrowseScreen";
import WishlistScreen from "@/screens/WishlistScreen";
import TransactionsScreen from "@/screens/TransactionsScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import CardDetailScreen from "@/screens/CardDetailScreen";
import CartScreen from "@/screens/CartScreen";
import SettingsScreen from "@/screens/SettingsScreen";

/** Auth gate: redirects unauthenticated users to /login. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useUserStore((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

export default function App() {
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to /home when already logged in and on an auth screen.
  useEffect(() => {
    const onAuth = location.pathname === "/login" || location.pathname === "/onboarding";
    if (user && onAuth) navigate("/home", { replace: true });
  }, [user, location.pathname, navigate]);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/onboarding" element={<OnboardingScreen />} />

      {/* Protected — all inside the tab layout */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomeScreen />} />
        <Route path="browse" element={<BrowseScreen />} />
        <Route path="wishlist" element={<WishlistScreen />} />
        <Route path="transactions" element={<TransactionsScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
        <Route path="card/:id" element={<CardDetailScreen />} />
        <Route path="cart" element={<CartScreen />} />
        <Route path="settings" element={<SettingsScreen />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

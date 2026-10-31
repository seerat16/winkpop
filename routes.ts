import { createBrowserRouter } from "react-router";
import { AppShell } from "./components/AppShell";
import LoginScreen from "./screens/LoginScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import HomeScreen from "./screens/HomeScreen";
import BrowseScreen from "./screens/BrowseScreen";
import CardDetailScreen from "./screens/CardDetailScreen";
import WishlistScreen from "./screens/WishlistScreen";
import CartScreen from "./screens/CartScreen";
import TradesScreen from "./screens/TradesScreen";
import ProfileScreen from "./screens/ProfileScreen";
import CollectionScreen from "./screens/CollectionScreen";
import InstagramLoginScreen from "./screens/InstagramLoginScreen";


export const router = createBrowserRouter([
  {
    path: "/",
    Component: AppShell,
    children: [
      { index: true, Component: LoginScreen },
      { path: "login", Component: LoginScreen },
      { path: "onboarding", Component: OnboardingScreen },
      { path: "home", Component: HomeScreen },
      { path: "browse", Component: BrowseScreen },
      { path: "card/:id", Component: CardDetailScreen },
      { path: "wishlist", Component: WishlistScreen },
      { path: "cart", Component: CartScreen },
      { path: "trades", Component: TradesScreen },
      { path: "profile", Component: ProfileScreen },
      { path: "collection", Component: CollectionScreen },
      { path: "login/instagram", Component: InstagramLoginScreen },
    ],
  },
]);

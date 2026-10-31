import { type ReactNode } from "react";
import { RouterProvider, useLocation } from "./router";
import { Toaster } from "sonner";
import { seedDefaultUser } from "./data/userStore";
import { BottomNav } from "./components/BottomNav";

seedDefaultUser();

import LoginScreen from "./screens/LoginScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import HomeScreen from "./screens/HomeScreen";
import BrowseScreen from "./screens/BrowseScreen";
import CardDetailScreen from "./screens/CardDetailScreen";
import WishlistScreen from "./screens/WishlistScreen";
import CartScreen from "./screens/CartScreen";
import TradesScreen from "./screens/TradesScreen";
import TransactionsScreen from "./screens/TransactionsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import CollectionScreen from "./screens/CollectionScreen";
import InstagramLoginScreen from "./screens/InstagramLoginScreen";
import SettingsScreen from "./screens/SettingsScreen";
import GroupDetailScreen from "./screens/GroupDetailScreen";
import SalesScreen from "./screens/SalesScreen";
import EditGroupsScreen from "./screens/EditGroupsScreen";
import ListCardScreen from "./screens/ListCardScreen";
import MessagingScreen from "./screens/MessagingScreen";
import ReviewsScreen from "./screens/ReviewsScreen";
import BrowseSelectScreen from "./screens/BrowseSelectScreen";
import ListingDetailScreen from "./screens/ListingDetailScreen";
import PurchasesScreen from "./screens/PurchasesScreen";
import MySalesScreen from "./screens/MySalesScreen";
import PersonalWishlistScreen from "./screens/PersonalWishlistScreen";
import UploadPostScreen from "./screens/UploadPostScreen";
import LikesScreen from "./screens/LikesScreen";
import AllTrackingScreen from "./screens/AllTrackingScreen";

const NO_NAV_PATHS = [
  "/",
  "/login",
  "/onboarding",
  "/login/instagram",
  "/settings",
  "/group/:id",
  "/edit-groups",
  "/list-card",
  "/upload-post",
  "/reviews",
  "/browse-select",
  "/listing/:id",
];

const ROUTES = [
  { path: "/", Component: LoginScreen },
  { path: "/login", Component: LoginScreen },
  { path: "/login/instagram", Component: InstagramLoginScreen },
  { path: "/onboarding", Component: OnboardingScreen },
  { path: "/home", Component: HomeScreen },
  { path: "/browse", Component: BrowseScreen },
  { path: "/card/:id", Component: CardDetailScreen },
  { path: "/wishlist", Component: PersonalWishlistScreen },
  { path: "/cart", Component: CartScreen },
  { path: "/sales", Component: SalesScreen },
  { path: "/trades", Component: TradesScreen },
  { path: "/transactions", Component: TransactionsScreen },
  { path: "/profile", Component: ProfileScreen },
  { path: "/collection", Component: CollectionScreen },
  { path: "/settings", Component: SettingsScreen },
  { path: "/group/:id", Component: GroupDetailScreen },
  { path: "/edit-groups", Component: EditGroupsScreen },
  { path: "/list-card", Component: ListCardScreen },
  { path: "/messages", Component: MessagingScreen },
  { path: "/reviews", Component: ReviewsScreen },
  { path: "/browse-select", Component: BrowseSelectScreen },
  { path: "/listing/:id", Component: ListingDetailScreen },
  { path: "/purchases", Component: PurchasesScreen },
  { path: "/my-sales", Component: MySalesScreen },
  { path: "/personal-wishlist", Component: PersonalWishlistScreen },
  { path: "/upload-post", Component: UploadPostScreen },
  { path: "/likes", Component: LikesScreen },
  { path: "/all-tracking", Component: AllTrackingScreen },
];

function Shell({ children, showNav }: { children: ReactNode; showNav: boolean }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="w-full max-w-md mx-auto flex-1 flex flex-col" style={{ paddingBottom: showNav ? "65px" : 0 }}>
        {children}
      </div>
      {showNav && <BottomNav />}
      <Toaster position="top-center" />
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider
      routes={ROUTES}
      noNavPaths={NO_NAV_PATHS}
      Shell={Shell}
    />
  );
}

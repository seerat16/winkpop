import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useUserStore } from "@/data/userStore";
import Layout from "@/components/Layout";
import BlockedUsersScreen from "@/screens/BlockedUsersScreen";
import BrowseScreen from "@/screens/BrowseScreen";
import BuyNowScreen from "@/screens/BuyNowScreen";
import CardDetailScreen from "@/screens/CardDetailScreen";
import CartScreen from "@/screens/CartScreen";
import CatalogEntryScreen from "@/screens/CatalogEntryScreen";
import ChatScreen from "@/screens/ChatScreen";
import CollectionScreen from "@/screens/CollectionScreen";
import CommunityScreen from "@/screens/CommunityScreen";
import DatabaseScreen from "@/screens/DatabaseScreen";
import EditCollectingScreen from "@/screens/EditCollectingScreen";
import EditProfileScreen from "@/screens/EditProfileScreen";
import FollowsScreen from "@/screens/FollowsScreen";
import ForgotPasswordScreen from "@/screens/ForgotPasswordScreen";
import GroupOrdersScreen from "@/screens/GroupOrdersScreen";
import GroupScreen from "@/screens/GroupScreen";
import HighlightsScreen from "@/screens/HighlightsScreen";
import HomeScreen from "@/screens/HomeScreen";
import HubScreen from "@/screens/HubScreen";
import LikesScreen from "@/screens/LikesScreen";
import ListingCommentsScreen from "@/screens/ListingCommentsScreen";
import ListingFormScreen from "@/screens/ListingFormScreen";
import LoginScreen from "@/screens/LoginScreen";
import MessagesScreen from "@/screens/MessagesScreen";
import NewMessageScreen from "@/screens/NewMessageScreen";
import NewStoryScreen from "@/screens/NewStoryScreen";
import NewTradeScreen from "@/screens/NewTradeScreen";
import NewWishlistScreen from "@/screens/NewWishlistScreen";
import NotificationSettingsScreen from "@/screens/NotificationSettingsScreen";
import NotificationsScreen from "@/screens/NotificationsScreen";
import OnboardingScreen from "@/screens/OnboardingScreen";
import OrderTrackingScreen from "@/screens/OrderTrackingScreen";
import PaymentsScreen from "@/screens/PaymentsScreen";
import PostDetailScreen from "@/screens/PostDetailScreen";
import PostFormScreen from "@/screens/PostFormScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import ReviewsScreen from "@/screens/ReviewsScreen";
import SafetyScreen from "@/screens/SafetyScreen";
import SavedFoldersScreen from "@/screens/SavedFoldersScreen";
import SavesScreen from "@/screens/SavesScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import ShareScreen from "@/screens/ShareScreen";
import ShippingSettingsScreen from "@/screens/ShippingSettingsScreen";
import StoryViewerScreen from "@/screens/StoryViewerScreen";
import TrackingListScreen from "@/screens/TrackingListScreen";
import TransactionsScreen from "@/screens/TransactionsScreen";
import TutorialScreen from "@/screens/TutorialScreen";
import UserProfileScreen from "@/screens/UserProfileScreen";
import WishlistDetailScreen from "@/screens/WishlistDetailScreen";
import WishlistScreen from "@/screens/WishlistScreen";
import WishlistsScreen from "@/screens/WishlistsScreen";
import WriteReviewScreen from "@/screens/WriteReviewScreen";
import InviteScreen from "@/screens/InviteScreen";
import CheckoutReturnScreen from "@/screens/CheckoutReturnScreen";

const AUTH_PATHS = ["/login", "/forgot", "/onboarding"];

/** Auth gate: unauthenticated users go to /login, unfinished signups to /onboarding. */
function RequireAuth() {
  const user = useUserStore((s) => s.user);
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!user.onboarded) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

/** Full-screen pages (no tab bar) share the same phone-width column. */
function FullScreen() {
  return (
    <div className="mx-auto h-full max-w-md bg-wink-purple-tint">
      <Outlet />
    </div>
  );
}

export default function App() {
  const user = useUserStore((s) => s.user);
  const pruneCart = useUserStore((s) => s.pruneCart);
  const navigate = useNavigate();
  const location = useLocation();

  // Already signed in (and onboarded) on an auth screen → straight to the feed (§1Y).
  useEffect(() => {
    const onAuth = AUTH_PATHS.includes(location.pathname);
    if (user?.onboarded && onAuth) navigate("/home", { replace: true });
  }, [user, location.pathname, navigate]);

  // Cart items are auto-removed after 30 days (§7Y).
  useEffect(() => {
    if (user) pruneCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <Routes>
      {/* Public / signup */}
      <Route element={<FullScreen />}>
        <Route path="/forgot" element={<ForgotPasswordScreen />} />
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/onboarding" element={<OnboardingScreen />} />
      </Route>

      <Route element={<RequireAuth />}>
        {/* Bottom-tab screens */}
        <Route element={<Layout />}>
        <Route path="browse" element={<BrowseScreen />} />
        <Route path="home" element={<HomeScreen />} />
        <Route path="messages" element={<MessagesScreen />} />
        <Route path="profile" element={<ProfileScreen />} />
        <Route path="transactions" element={<TransactionsScreen />} />
        <Route path="wishlist" element={<WishlistScreen />} />
        </Route>
        {/* Full-screen pages */}
        <Route element={<FullScreen />}>
          <Route path="cart" element={<CartScreen />} />
          <Route path="chat/new" element={<NewMessageScreen />} />
          <Route path="checkout/return" element={<CheckoutReturnScreen />} />
          <Route path="collection" element={<CollectionScreen />} />
          <Route path="community" element={<CommunityScreen />} />
          <Route path="database" element={<DatabaseScreen />} />
          <Route path="edit-collecting" element={<EditCollectingScreen />} />
          <Route path="edit-profile" element={<EditProfileScreen />} />
          <Route path="group-orders" element={<GroupOrdersScreen />} />
          <Route path="highlights" element={<HighlightsScreen />} />
          <Route path="hub" element={<HubScreen />} />
          <Route path="invite" element={<InviteScreen />} />
          <Route path="likes" element={<LikesScreen />} />
          <Route path="listing/new" element={<ListingFormScreen />} />
          <Route path="notifications" element={<NotificationsScreen />} />
          <Route path="post/new" element={<PostFormScreen />} />
          <Route path="safety" element={<SafetyScreen />} />
          <Route path="saved-folders" element={<SavedFoldersScreen />} />
          <Route path="saves" element={<SavesScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
          <Route path="settings/blocked" element={<BlockedUsersScreen />} />
          <Route path="settings/notifications" element={<NotificationSettingsScreen />} />
          <Route path="settings/payments" element={<PaymentsScreen />} />
          <Route path="settings/shipping" element={<ShippingSettingsScreen />} />
          <Route path="share" element={<ShareScreen />} />
          <Route path="story/new" element={<NewStoryScreen />} />
          <Route path="tracking" element={<TrackingListScreen />} />
          <Route path="trade/new" element={<NewTradeScreen />} />
          <Route path="tutorial" element={<TutorialScreen />} />
          <Route path="wishlists" element={<WishlistsScreen />} />
          <Route path="wishlists/new" element={<NewWishlistScreen />} />
          <Route path="buy/:id" element={<BuyNowScreen />} />
          <Route path="card/:id" element={<CardDetailScreen />} />
          <Route path="catalog/:id" element={<CatalogEntryScreen />} />
          <Route path="chat/:id" element={<ChatScreen />} />
          <Route path="comments/:id" element={<ListingCommentsScreen />} />
          <Route path="follows/:username" element={<FollowsScreen />} />
          <Route path="group/:id" element={<GroupScreen />} />
          <Route path="post/:id" element={<PostDetailScreen />} />
          <Route path="review/:orderId" element={<WriteReviewScreen />} />
          <Route path="reviews/:username" element={<ReviewsScreen />} />
          <Route path="story/:username" element={<StoryViewerScreen />} />
          <Route path="tracking/:id" element={<OrderTrackingScreen />} />
          <Route path="user/:username" element={<UserProfileScreen />} />
          <Route path="wishlists/:id" element={<WishlistDetailScreen />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/home" replace />} />
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

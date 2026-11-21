import { Redirect } from "expo-router";

/**
 * Placeholder route for the centre "+" tab. Pressing the tab opens the upload
 * sheet in the tabs layout instead of navigating here; deep links fall back to
 * the listing flow.
 */
export default function UploadTab() {
  return <Redirect href="/listing/new" />;
}

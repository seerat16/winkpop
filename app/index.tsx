import { Redirect } from "expo-router";

/** Entry point simply defers to the auth gate in the root layout. */
export default function Index() {
  return <Redirect href="/(auth)/login" />;
}

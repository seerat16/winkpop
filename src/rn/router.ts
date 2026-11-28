/**
 * expo-router–style navigation hooks on top of react-router.
 *
 * Screens call `router.push("/card/123")`, `router.replace(...)`,
 * `router.back()` and read params with `useLocalSearchParams()`. Expo route
 * groups like "/(tabs)/home" are normalised to "/home".
 */
import { createElement, useMemo } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { normalizeHref } from "./href";


export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (href: string) => navigate(normalizeHref(href)),
      navigate: (href: string) => navigate(normalizeHref(href)),
      replace: (href: string) => navigate(normalizeHref(href), { replace: true }),
      back: () => {
        if (window.history.length > 1) navigate(-1);
        else navigate("/home", { replace: true });
      },
      canGoBack: () => window.history.length > 1,
    }),
    [navigate],
  );
}

/** Route params merged with query-string params (query wins on clashes). */
export function useLocalSearchParams<T extends Record<string, string | undefined> = Record<string, string>>(): Partial<T> {
  const params = useParams();
  const { search } = useLocation();
  return useMemo(() => {
    const q = Object.fromEntries(new URLSearchParams(search).entries());
    return { ...params, ...q } as Partial<T>;
  }, [params, search]);
}

export function Redirect({ href }: { href: string }) {
  return createElement(Navigate, { to: normalizeHref(href), replace: true });
}

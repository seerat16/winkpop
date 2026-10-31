import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface NavigateOptions { replace?: boolean }

interface RouterContextValue {
  path: string;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  navigate: (to: string | number, opts?: NavigateOptions) => void;
}

const RouterContext = createContext<RouterContextValue>({
  path: "/",
  params: {},
  searchParams: new URLSearchParams(),
  navigate: () => {},
});

export function useNavigate() {
  const ctx = useContext(RouterContext);
  return ctx.navigate;
}

export function useLocation() {
  const ctx = useContext(RouterContext);
  return { pathname: ctx.path, search: "" };
}

export function useParams<T extends Record<string, string>>(): T {
  const ctx = useContext(RouterContext);
  return ctx.params as T;
}

export function useSearchParams(): [URLSearchParams, (p: URLSearchParams) => void] {
  const ctx = useContext(RouterContext);
  return [ctx.searchParams, () => {}];
}

// Match a pattern like "/card/:id" against a path like "/card/pc001"
function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patParts.length; i++) {
    if (patParts[i].startsWith(":")) {
      params[patParts[i].slice(1)] = pathParts[i];
    } else if (patParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

interface Route {
  path: string;
  Component: React.ComponentType;
}

interface RouterProviderProps {
  routes: Route[];
  noNavPaths?: string[];
  Shell: React.ComponentType<{ children: ReactNode; showNav: boolean }>;
}

export function RouterProvider({ routes, noNavPaths = [], Shell }: RouterProviderProps) {
  const [path, setPath] = useState("/");
  const [search, setSearch] = useState("");
  const [history, setHistory] = useState<string[]>(["/"]);

  const navigate = useCallback((to: string | number, opts?: NavigateOptions) => {
    if (typeof to === "number") {
      setHistory(prev => {
        const next = [...prev];
        const target = next[next.length + to - 1] ?? "/";
        next.pop();
        const [targetPath, targetSearch = ""] = target.split("?");
        setPath(targetPath);
        setSearch(targetSearch);
        return next;
      });
      return;
    }
    const [pathPart, searchPart = ""] = to.split("?");
    setPath(pathPart);
    setSearch(searchPart);
    setHistory(prev => opts?.replace ? [...prev.slice(0, -1), to] : [...prev, to]);
  }, []);

  // Find matching route
  let MatchedComponent: React.ComponentType | null = null;
  let matchedParams: Record<string, string> = {};
  const searchParams = new URLSearchParams(search);

  for (const route of routes) {
    const params = matchPath(route.path, path);
    if (params !== null) {
      MatchedComponent = route.Component;
      matchedParams = params;
      break;
    }
  }

  const showNav = !noNavPaths.includes(path);

  return (
    <RouterContext.Provider value={{ path, params: matchedParams, searchParams, navigate }}>
      <Shell showNav={showNav}>
        {MatchedComponent ? <MatchedComponent /> : <div className="p-8 text-center text-gray-400">Page not found</div>}
      </Shell>
    </RouterContext.Provider>
  );
}

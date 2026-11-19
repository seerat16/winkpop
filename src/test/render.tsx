import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

/** Render a component inside a MemoryRouter (needed by anything using router hooks). */
export function renderWithRouter(ui: ReactElement, { route = "/" } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>);
}

export * from "@testing-library/react";

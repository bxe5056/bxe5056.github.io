import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";

test.skip("renders without crashing", () => {
  render(
    <MemoryRouter>
      <App />
    </MemoryRouter>
  );
});

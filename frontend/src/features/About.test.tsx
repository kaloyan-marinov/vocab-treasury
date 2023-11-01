import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { About } from "./About";

test("renders an 'About VocabTreasury...' message", () => {
  render(<About />);
  const headingElement = screen.getByText("About VocabTreasury...");
  expect(headingElement).toBeInTheDocument();
});

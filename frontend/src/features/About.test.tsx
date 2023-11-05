import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { About } from "./About";

test("renders an 'About VocabTreasury...' message", () => {
  /* Arrange. */
  /* This test does not require for anything to be (pre-)arranged. */

  /* Act. */
  render(<About />);

  /* Assert. */
  const headingElement = screen.getByText("About VocabTreasury...");
  expect(headingElement).toBeInTheDocument();
});

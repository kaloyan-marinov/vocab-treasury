import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { Home } from "./Home";

test("renders a 'Welcome to VocabTreasury!' message", () => {
  render(<Home />);
  const headingElement = screen.getByText("Welcome to VocabTreasury!");

  /*
      The following statement throws a
      `TypeError: expect(...).toBeInTheDocument is not a function`
  
      The post and comments on
      https://stackoverflow.com/questions/56547215/react-testing-library-why-is-tobeinthedocument-not-a-function
      explain that:
  
      - the reason for the error is that
        `toBeInTheDocument` is not part of the React Testing Library
  
      - the problem can be rectified
        by adding `import '@testing-library/jest-dom' into this file
  
      - in fact, the problem had been solved to begin with
        by the Create React App utility itself,
        because it had added the above-mentioned import statement into `setupTests.ts`
        (which means that the "21: remove files and boilerplate code, which ..." commit was
        what gave rise to this problem in this repository)
      */
  expect(headingElement).toBeInTheDocument();
});

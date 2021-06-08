import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders a 'Welcome to VocabTreasury!' message", () => {
  render(<App />);
  const headingElement = screen.getByText("Welcome to VocabTreasury!");
  console.log(headingElement);

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

test("renders navigation links", () => {
  render(<App />);
  const navigationLinkTexts = ["Home", "About", "Log in", "Register"];
  for (const nLT of navigationLinkTexts) {
    const element = screen.getByText(nLT);
    expect(element).toBeInTheDocument();
  }
});

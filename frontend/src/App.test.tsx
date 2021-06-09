import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { NavigationBar, Home, About, Register, Login } from "./App";

describe("<Home>", () => {
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
});

describe("<NavigationBar>", () => {
  test("renders navigation links that are always visible", () => {
    render(<NavigationBar />);
    const navigationLinkTexts = ["VocabTreasury", "Home", "About"];
    for (const nLT of navigationLinkTexts) {
      const element = screen.getByText(nLT);
      expect(element).toBeInTheDocument();
    }
  });

  test("renders navigation links for guest users", () => {
    render(<NavigationBar />);
    const navigationLinkTexts = ["Log in", "Register"];
    for (const nLT of navigationLinkTexts) {
      const element = screen.getByText(nLT);
      expect(element).toBeInTheDocument();
    }
  });

  test("renders navigation links for logged-in users", () => {
    render(<NavigationBar />);
    const navigationLinkTexts = ["Own VocabTreasury", "Account", "Log out"];
    for (const nLT of navigationLinkTexts) {
      const element = screen.getByText(nLT);
      expect(element).toBeInTheDocument();
    }
  });
});

describe("<About>", () => {
  test("renders an 'About VocabTreasury...' message", () => {
    render(<About />);
    const headingElement = screen.getByText("About VocabTreasury...");
    expect(headingElement).toBeInTheDocument();
  });
});

describe("<Register>", () => {
  test("renders (a <legend> tag and) a registration form", () => {
    render(<Register />);

    const legendElement = screen.getByText("[legend-tag: JOIN TODAY]");
    expect(legendElement).toBeInTheDocument();

    const usernameLabelElement = screen.getByText("USERNAME");
    expect(usernameLabelElement).toBeInTheDocument();

    const emailLabelElement = screen.getByText("EMAIL");
    expect(emailLabelElement).toBeInTheDocument();

    const passwordLabelElement = screen.getByText("PASSWORD");
    expect(passwordLabelElement).toBeInTheDocument();

    const confirmPasswordLabelElement = screen.getByText("CONFIRM PASSWORD");
    expect(confirmPasswordLabelElement).toBeInTheDocument();

    const submitInputElement = screen.getByRole("button", {
      name: "CREATE MY ACCOUNT",
    });
    expect(submitInputElement).toBeInTheDocument();
  });
});

describe("<Login>", () => {
  test("renders (a <legend> tag and) a login form", () => {
    render(<Login />);

    const legendElement = screen.getByText("LOG IN");
    expect(legendElement).toBeInTheDocument();

    const emailLabelElement = screen.getByText("EMAIL");
    expect(emailLabelElement).toBeInTheDocument();

    const passwordLabelElement = screen.getByText("PASSWORD");
    expect(passwordLabelElement).toBeInTheDocument();

    const submitInputElement = screen.getByRole("button", {
      name: "LOG INTO MY ACCOUNT",
    });
    expect(submitInputElement).toBeInTheDocument();
  });
});

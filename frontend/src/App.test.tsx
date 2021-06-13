import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import {
  NavigationBar,
  Home,
  About,
  Register,
  Login,
  Account,
  OwnVocabTreasury,
  RecordNewExample,
  SingleExample,
  Search,
} from "./App";

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

describe("<Account>", () => {
  test("renders a greeting for the logged-in user", () => {
    render(<Account />);

    const headingElement = screen.getByText("jd");
    expect(headingElement).toBeInTheDocument();
  });
});

describe("<OwnVocabTreasury>", () => {
  test(
    "renders a heading, manipulation links," +
      " and a page of the logged-in user's Example resources",
    () => {
      render(<OwnVocabTreasury />);

      const headingElement = screen.getByText(
        "Own VocabTreasury for john.doe@protonmail.com"
      );
      expect(headingElement).toBeInTheDocument();

      const recordNewExampleAnchor = screen.getByText("Record new example");
      expect(recordNewExampleAnchor).toBeInTheDocument();

      const searchAnchor = screen.getByText("Search");
      expect(searchAnchor).toBeInTheDocument();

      for (const columnName of [
        "ID",
        "SOURCE LANGUAGE",
        "NEW WORD",
        "EXAMPLE",
        "TRANSLATION",
      ]) {
        const tableCellElement = screen.getByText(columnName);
        expect(tableCellElement).toBeInTheDocument();
      }

      for (const columnValue of [
        // "Finnish",
        "sama",
        "Olemme samaa mieltä.",
        "I agree.",
      ]) {
        const tableCellElement = screen.getByText(columnValue);
        expect(tableCellElement).toBeInTheDocument();
      }

      const tableCellElementsForFinnish = screen.getAllByText("Finnish");
      expect(tableCellElementsForFinnish.length).toEqual(9);

      const tableCellElementsForGerman = screen.getAllByText("German");
      expect(tableCellElementsForGerman).toHaveLength(1);
    }
  );
});

describe("<RecordNewExample>", () => {
  test("renders the fields of a form for creating a new Example resource", () => {
    render(<RecordNewExample />);

    const legendElement = screen.getByText("[legend-tag]: CREATE NEW EXAMPLE");
    expect(legendElement).toBeInTheDocument();

    const sourceLanguageLabelElement = screen.getByText("SOURCE LANGUAGE");
    expect(sourceLanguageLabelElement).toBeInTheDocument();

    const newWordLabelElement = screen.getByText("NEW WORD");
    expect(newWordLabelElement).toBeInTheDocument();

    const exampleLabelElement = screen.getByText("EXAMPLE");
    expect(exampleLabelElement).toBeInTheDocument();

    const translationLabelElement = screen.getByText("TRANSLATION");
    expect(translationLabelElement).toBeInTheDocument();

    const submitInputElement = screen.getByRole("button", {
      name: "RECORD THIS EXAMPLE",
    });
    expect(submitInputElement).toBeInTheDocument();
  });
});

describe("<SingleExample>", () => {
  test(
    "renders a specific Example resource" +
      " and HTML elements that enable user interaction",
    () => {
      render(<SingleExample />);

      const divElement = screen.getByText(
        "You have selected the following Example from your Own VocabTreasury:"
      );
      expect(divElement).toBeInTheDocument();

      // First row.
      const idTableCellElement1 = screen.getByText("ID");
      expect(idTableCellElement1).toBeInTheDocument();

      const sourceLanguageTableCellElement1 =
        screen.getByText("SOURCE LANGUAGE");
      expect(sourceLanguageTableCellElement1).toBeInTheDocument();

      const newWordTableCellElement1 = screen.getByText("NEW WORD");
      expect(newWordTableCellElement1).toBeInTheDocument();

      const exampleTableCellElement1 = screen.getByText("EXAMPLE");
      expect(exampleTableCellElement1).toBeInTheDocument();

      const translationTableCellElement1 = screen.getByText("TRANSLATION");
      expect(translationTableCellElement1).toBeInTheDocument();

      // Second row.
      const idTableCellElement2 = screen.getByText("4");
      expect(idTableCellElement2).toBeInTheDocument();

      const sourceLanguageTableCellElement2 = screen.getByText("Finnish");
      expect(sourceLanguageTableCellElement2).toBeInTheDocument();

      const newWordTableCellElement2 = screen.getByText("sama");
      expect(newWordTableCellElement2).toBeInTheDocument();

      const exampleTableCellElement2 = screen.getByText("Olemme samaa mieltä.");
      expect(exampleTableCellElement2).toBeInTheDocument();

      const translationTableCellElement2 = screen.getByText("I agree.");
      expect(translationTableCellElement2).toBeInTheDocument();

      // HTML elements that enable user interaction.
      const anchorForReturning = screen.getByText(
        "Return to this example within my Own VocabTreasury"
      );
      expect(anchorForReturning).toBeInTheDocument();

      const anchorForEditing = screen.getByText("Edit this example");
      expect(anchorForEditing).toBeInTheDocument();

      const buttonForDeleting = screen.getByRole("button", {
        name: "Delete this example",
      });
      expect(buttonForDeleting).toBeInTheDocument();
    }
  );
});

describe("<Search>", () => {
  test(
    "renders the fiels of a form" +
      " for searching through the logged-in user's Example resources",
    () => {
      render(<Search />);

      const idTableCellElement = screen.getByText("ID");
      expect(idTableCellElement).toBeInTheDocument();

      const sourceLanguageTableCellElement =
        screen.getByText("SOURCE LANGUAGE");
      expect(sourceLanguageTableCellElement).toBeInTheDocument();

      const newWordTableCellElement = screen.getByText("NEW WORD");
      expect(newWordTableCellElement).toBeInTheDocument();

      const exampleTableCellElement = screen.getByText("EXAMPLE");
      expect(exampleTableCellElement).toBeInTheDocument();

      const translationTableCellElement = screen.getByText("TRANSLATION");
      expect(translationTableCellElement).toBeInTheDocument();
    }
  );
});

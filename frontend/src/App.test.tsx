// 1
import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { createStore } from "redux";
import { Provider } from "react-redux";

import { createMemoryHistory } from "history";
import { Router, Route } from "react-router-dom";

import {
  IState,
  initialState,
  rootReducer,
  VOCAB_TREASURY_APP_TOKEN,
} from "./store";
import {
  NavigationBar,
  Alerts,
  Home,
  About,
  Register,
  Login,
  RequestPasswordReset,
  Account,
  OwnVocabTreasury,
  RecordNewExample,
  SingleExample,
  EditExample,
  Search,
} from "./App";

// 2
import { rest } from "msw";
import { setupServer } from "msw/node";

import { applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";

import { waitFor } from "@testing-library/react";

// 3
import { profileMock } from "./dataMocks";

import { App } from "./App";
import { initialStateAlerts, initialStateAuth } from "./store";
import { cleanup } from "@testing-library/react";

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
  const alwaysVisibleLinks = ["VocabTreasury", "Home", "About"];
  const guestUserLinks = ["Log in", "Register"];
  const loggedInUserLinks = ["Own VocabTreasury", "Account", "Log out"];

  test("renders all of a guest user's navigation links", () => {
    /* Arrange. */
    const realStore = createStore(rootReducer);
    const history = createMemoryHistory();

    /* Act. */
    render(
      <Provider store={realStore}>
        <Router history={history}>
          <NavigationBar />
        </Router>
      </Provider>
    );

    /* Assert. */
    for (const navigationLinkText of alwaysVisibleLinks.concat(
      guestUserLinks
    )) {
      const element = screen.getByText(navigationLinkText);
      expect(element).toBeInTheDocument();
    }

    for (const navigationLinkText of loggedInUserLinks) {
      const element = screen.queryByText(navigationLinkText);
      expect(element).not.toBeInTheDocument();
    }
  });

  test("renders all of a logged-in user's navigation links", () => {
    /* Arrange. */
    const initState = {
      ...initialState,
      auth: {
        ...initialState.auth,
        hasValidToken: true,
      },
    };
    const realStore = createStore(rootReducer, initState);
    const history = createMemoryHistory();

    /* Act. */
    render(
      <Provider store={realStore}>
        <Router history={history}>
          <NavigationBar />
        </Router>
      </Provider>
    );

    /* Assert. */
    for (const navigationLinkText of alwaysVisibleLinks.concat(
      loggedInUserLinks
    )) {
      const element = screen.getByText(navigationLinkText);
      expect(element).toBeInTheDocument();
    }

    for (const navigationLinkText of guestUserLinks) {
      const element = screen.queryByText(navigationLinkText);
      expect(element).not.toBeInTheDocument();
    }
  });

  test(
    "+ <Alerts> - renders an alert" +
      " after the user clicks on the 'Log out' link",
    async () => {
      /* Arrange. */
      const initState = {
        ...initialState,
        auth: {
          ...initialState.auth,
          hasValidToken: true,
        },
      };
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, initState, enhancer);
      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <Alerts />
            <NavigationBar />
          </Router>
        </Provider>
      );

      /* Act. */
      const logoutAnchor = screen.getByText("Log out");
      fireEvent.click(logoutAnchor);

      /* Assert. */
      await waitFor(() => {
        screen.getByText("LOGOUT SUCCESSFUL");
      });
    }
  );
});

describe("<Alerts>", () => {
  test("renders the alerts, which are present in the Redux state", () => {
    /* Arrange. */
    const initState: IState = {
      ...initialState,
      alerts: {
        ids: ["alert-id-17"],
        entities: {
          "alert-id-17": {
            id: "alert-id-17",
            message: "PLEASE LOG IN.",
          },
        },
      },
    };
    const realStore = createStore(rootReducer, initState);

    /* Act. */
    render(
      <Provider store={realStore}>
        <Alerts />
      </Provider>
    );

    /* Assert. */
    const buttonElement = screen.getByRole("button", { name: "Clear alert" });
    expect(buttonElement).toBeInTheDocument();

    screen.getByText("PLEASE LOG IN.");
  });

  test("re-renders the alerts after the user has cleared one of them", () => {
    /* Arrange. */
    const initState: IState = {
      ...initialState,
      alerts: {
        ids: ["alert-id-17", "alert-id-34"],
        entities: {
          "alert-id-17": {
            id: "alert-id-17",
            message: "YOU HAVE BEEN LOGGED OUT.",
          },
          "alert-id-34": {
            id: "alert-id-34",
            message: "PLEASE LOG BACK IN.",
          },
        },
      },
    };
    const realStore = createStore(rootReducer, initState);

    render(
      <Provider store={realStore}>
        <Alerts />
      </Provider>
    );

    /* Act. */
    const buttons = screen.getAllByRole("button", { name: "Clear alert" });
    expect(buttons.length).toEqual(2);

    fireEvent.click(buttons[0]);

    /* Assert. */
    const nullValue: HTMLElement | null = screen.queryByText(
      "YOU HAVE BEEN LOGGED OUT."
    );
    expect(nullValue).not.toBeInTheDocument();

    screen.getByText("PLEASE LOG BACK IN.");
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
    /* Arrange. */
    const realStore = createStore(rootReducer);
    const history = createMemoryHistory();

    /* Act. */
    render(
      <Provider store={realStore}>
        <Router history={history}>
          <Register />
        </Router>
      </Provider>
    );

    /* Assert. */
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

  test(
    "+ <Alerts> - renders an alert" +
      " after the user has submitted the form" +
      " without completing all its fields",
    () => {
      /* Arrange. */
      const realStore = createStore(rootReducer);
      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <Alerts />
            <Register />
          </Router>
        </Provider>
      );

      const usernameInputElement = screen.getByLabelText("USERNAME");
      expect(usernameInputElement).toBeInTheDocument();
      const emailInputElement = screen.getByLabelText("EMAIL");
      expect(emailInputElement).toBeInTheDocument();
      const passwordInputElement = screen.getByLabelText("PASSWORD");
      expect(passwordInputElement).toBeInTheDocument();
      // const confirmPasswordInputElement =
      //   screen.getByLabelText("CONFIRM PASSWORD");
      // expect(confirmPasswordInputElement).toBeInTheDocument()

      fireEvent.change(usernameInputElement, { target: { value: "test-jd" } });
      fireEvent.change(emailInputElement, {
        target: { value: "test-jd@protonmail.com" },
      });
      fireEvent.change(passwordInputElement, { target: { value: "test-123" } });
      // fireEvent.change(confirmPasswordInputElement, {target: {value: 'test-123'}})

      /* Act. */
      const submitButtonElement = screen.getByRole("button", {
        name: "CREATE MY ACCOUNT",
      });
      fireEvent.click(submitButtonElement);

      /* Assert. */
      screen.getByText("ALL FORM FIELDS MUST BE FILLED OUT");
    }
  );

  test(
    "+ <Alerts> - renders an alert" +
      " after the user has submitted the form" +
      " with non-matching values in the form's password fields",
    () => {
      /* Arrange. */
      const realStore = createStore(rootReducer);
      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <Alerts />
            <Register />
          </Router>
        </Provider>
      );

      const usernameInputElement = screen.getByLabelText("USERNAME");
      expect(usernameInputElement).toBeInTheDocument();
      const emailInputElement = screen.getByLabelText("EMAIL");
      expect(emailInputElement).toBeInTheDocument();
      const passwordInputElement = screen.getByLabelText("PASSWORD");
      expect(passwordInputElement).toBeInTheDocument();
      const confirmPasswordInputElement =
        screen.getByLabelText("CONFIRM PASSWORD");
      expect(confirmPasswordInputElement).toBeInTheDocument();

      fireEvent.change(usernameInputElement, { target: { value: "test-jd" } });
      fireEvent.change(emailInputElement, {
        target: { value: "test-jd@protonmail.com" },
      });
      fireEvent.change(passwordInputElement, { target: { value: "test-123" } });
      fireEvent.change(confirmPasswordInputElement, {
        target: { value: "different-from-test-123" },
      });

      /* Act. */
      const submitButtonElement = screen.getByRole("button", {
        name: "CREATE MY ACCOUNT",
      });
      fireEvent.click(submitButtonElement);

      /* Assert. */
      screen.getByText("THE PROVIDED PASSWORDS DON'T MATCH");
    }
  );
});

describe("<Login>", () => {
  test("renders (a <legend> tag and) a login form", () => {
    /* Arrange. */
    const realStore = createStore(rootReducer);
    const history = createMemoryHistory();

    /* Act. */
    render(
      <Provider store={realStore}>
        <Router history={history}>
          <Login />
        </Router>
      </Provider>
    );

    /* Assert. */
    const legendElement = screen.getByText("[legend-tag: LOG IN]");
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

  test(
    "+ <Alerts> - renders an alert" +
      " after the user has submitted the form" +
      " without completing all its fields",
    () => {
      /* Arrange. */
      const realStore = createStore(rootReducer);
      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <Alerts />
            <Login />
          </Router>
        </Provider>
      );

      const emailInputElement = screen.getByLabelText("EMAIL");
      expect(emailInputElement).toBeInTheDocument();
      // const passwordInputElement = screen.getByLabelText("PASSWORD");
      // expect(passwordInputElement).toBeInTheDocument();

      fireEvent.change(emailInputElement, {
        target: { value: "test-jd@protonmail.com" },
      });
      // fireEvent.change(passwordInputElement, { target: { value: "test-123" } });

      /* Act. */
      const submitButtonElement = screen.getByRole("button", {
        name: "LOG INTO MY ACCOUNT",
      });
      fireEvent.click(submitButtonElement);

      /* Assert. */
      screen.getByText("ALL FORM FIELDS MUST BE FILLED OUT");
    }
  );
});

describe("<RequestPasswordReset>", () => {
  test("render the fields of a form for requesting a password reset", () => {
    render(<RequestPasswordReset />);

    const legendElement = screen.getByText("[legend-tag: RESET PASSWORD]");
    expect(legendElement).toBeInTheDocument();

    const emailLabelElement = screen.getByText("EMAIL");
    expect(emailLabelElement).toBeInTheDocument();

    const requestPaswordResetElement = screen.getByText(
      "REQUEST PASSWORD RESET"
    );
    expect(requestPaswordResetElement).toBeInTheDocument();
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
      /* Arrange. */
      const history = createMemoryHistory();

      /* Act. */
      render(
        <Router history={history}>
          <OwnVocabTreasury />
        </Router>
      );

      /* Assert. */
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

    const legendElement = screen.getByText("[legend-tag: CREATE NEW EXAMPLE]");
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
      /* Arrange. */
      const history = createMemoryHistory();
      history.push("/example/4");

      /* Arrange. */
      render(
        <Router history={history}>
          <Route exact path="/example/:id">
            <SingleExample />
          </Route>
        </Router>
      );

      /* Assert. */
      const divElement = screen.getByText(
        "You have selected the following Example from your Own VocabTreasury:"
      );
      expect(divElement).toBeInTheDocument();

      /* First row. */
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

      /* Second row. */
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

describe("<EditExample>", () => {
  test("renders the fields of a form for editing an existing Example resource", () => {
    /* Arrange. */
    const history = createMemoryHistory();
    history.push("/example/4/edit");

    /* Act. */
    render(
      <Router history={history}>
        <Route exact path="/example/:id/edit">
          <EditExample />
        </Route>
      </Router>
    );

    /* Assert. */
    const legendElement = screen.getByText(
      "[legend-tag: EDIT EXISTING EXAMPLE]"
    );
    expect(legendElement).toBeInTheDocument();

    /* Labels of form fields. */
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

    /* Values of form fields. */
    const sourceLanguageTableCellElement2 = screen.getByDisplayValue("Finnish");
    expect(sourceLanguageTableCellElement2).toBeInTheDocument();

    const newWordTableCellElement2 = screen.getByDisplayValue("sama");
    expect(newWordTableCellElement2).toBeInTheDocument();

    const exampleTableCellElement2 = screen.getByDisplayValue(
      "Olemme samaa mieltä."
    );
    expect(exampleTableCellElement2).toBeInTheDocument();

    const translationTableCellElement2 = screen.getByDisplayValue("I agree.");
    expect(translationTableCellElement2).toBeInTheDocument();
  });
});

describe("<Search>", () => {
  test(
    "renders the fields of a form" +
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

/* Describe what requests should be mocked. */
const requestHandlersToMock = [
  rest.post("/api/users", (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 17,
        username: "mocked-request-jd",
      })
    );
  }),

  rest.post("/api/tokens", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: "mocked-token",
      })
    );
  }),

  rest.get("/api/user-profile", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(profileMock));
  }),
];

/* Create an MSW "request-interception layer". */
const quasiServer = setupServer(...requestHandlersToMock);

describe("multiple components + mocking of HTTP requests to the backend", () => {
  beforeAll(() => {
    /* Enable API mocking. */
    quasiServer.listen();
  });

  afterEach(() => {
    quasiServer.resetHandlers();
  });

  afterAll(() => {
    /* Disable API mocking. */
    quasiServer.close();
  });

  test(
    "<Alerts> + <Register> -" +
      " the user fills out the form and submits it," +
      " and the backend is _mocked_ to respond that" +
      " the form submission was accepted as valid and processed",
    async () => {
      /* Arrange. */
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);

      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <Alerts />
            <Register />
          </Router>
        </Provider>
      );

      const usernameInputElement = screen.getByLabelText("USERNAME");
      expect(usernameInputElement).toBeInTheDocument();
      const emailInputElement = screen.getByLabelText("EMAIL");
      expect(emailInputElement).toBeInTheDocument();
      const passwordInputElement = screen.getByLabelText("PASSWORD");
      expect(passwordInputElement).toBeInTheDocument();
      const confirmPasswordInputElement =
        screen.getByLabelText("CONFIRM PASSWORD");
      expect(confirmPasswordInputElement).toBeInTheDocument();

      fireEvent.change(usernameInputElement, { target: { value: "test-jd" } });
      fireEvent.change(emailInputElement, {
        target: { value: "test-jd@protonmail.com" },
      });
      fireEvent.change(passwordInputElement, { target: { value: "test-123" } });
      fireEvent.change(confirmPasswordInputElement, {
        target: { value: "test-123" },
      });

      /* Act. */
      const submitButtonElement = screen.getByRole("button", {
        name: "CREATE MY ACCOUNT",
      });
      fireEvent.click(submitButtonElement);

      /* Assert. */
      await waitFor(() => {
        screen.getByText("REGISTRATION SUCCESSFUL");
      });
    }
  );

  test(
    "<Alerts> + <Register> -" +
      " the user fills out the form and submits it," +
      " but the backend is _mocked_ to respond that" +
      " the form submission was determined to be invalid",
    async () => {
      /* Arrange. */
      quasiServer.use(
        rest.post("/api/users", (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              message: "[mocked-response] Failed to create a new User resource",
            })
          );
        })
      );

      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);

      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <Alerts />
            <Register />
          </Router>
        </Provider>
      );

      const usernameInputElement = screen.getByLabelText("USERNAME");
      expect(usernameInputElement).toBeInTheDocument();
      const emailInputElement = screen.getByLabelText("EMAIL");
      expect(emailInputElement).toBeInTheDocument();
      const passwordInputElement = screen.getByLabelText("PASSWORD");
      expect(passwordInputElement).toBeInTheDocument();
      const confirmPasswordInputElement =
        screen.getByLabelText("CONFIRM PASSWORD");
      expect(confirmPasswordInputElement).toBeInTheDocument();

      fireEvent.change(usernameInputElement, { target: { value: "test-jd" } });
      fireEvent.change(emailInputElement, {
        target: { value: "test-jd@protonmail.com" },
      });
      fireEvent.change(passwordInputElement, { target: { value: "test-123" } });
      fireEvent.change(confirmPasswordInputElement, {
        target: { value: "test-123" },
      });

      /* Act. */
      const submitButtonElement = screen.getByRole("button", {
        name: "CREATE MY ACCOUNT",
      });
      fireEvent.click(submitButtonElement);

      /* Assert. */
      await waitFor(() => {
        screen.getByText(
          "[mocked-response] Failed to create a new User resource"
        );
      });
    }
  );

  test(
    "<Alerts> + <Login> -" +
      " the user fills out the form and submits it," +
      " and the backend is _mocked_ to respond that" +
      " the form submission was accepted as valid and processed",
    async () => {
      /* Arrange. */
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);

      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <Alerts />
            <Login />
          </Router>
        </Provider>
      );

      const emailInputElement = screen.getByLabelText("EMAIL");
      expect(emailInputElement).toBeInTheDocument();
      const passwordInputElement = screen.getByLabelText("PASSWORD");
      expect(passwordInputElement).toBeInTheDocument();

      fireEvent.change(emailInputElement, {
        target: { value: "test-jd@protonmail.com" },
      });
      fireEvent.change(passwordInputElement, { target: { value: "test-123" } });

      /* Act. */
      const submitButtonElement = screen.getByRole("button", {
        name: "LOG INTO MY ACCOUNT",
      });
      fireEvent.click(submitButtonElement);

      /* Assert. */
      await waitFor(() => {
        screen.getByText("LOGIN SUCCESSFUL");
      });
    }
  );

  test(
    "<Alerts> + <Login> -" +
      " the user fills out the form and submits it," +
      " but the backend is _mocked_ to respond that" +
      " the form submission was determined to be invalid",
    async () => {
      /* Arrange. */
      quasiServer.use(
        rest.post("/api/tokens", (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: "[mocked] Bad Request",
              message: "[mocked] Incorrect email and/or password.",
            })
          );
        })
      );

      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);

      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <Alerts />
            <Login />
          </Router>
        </Provider>
      );

      const emailInputElement = screen.getByLabelText("EMAIL");
      expect(emailInputElement).toBeInTheDocument();
      const passwordInputElement = screen.getByLabelText("PASSWORD");
      expect(passwordInputElement).toBeInTheDocument();

      fireEvent.change(emailInputElement, {
        target: { value: "test-jd@protonmail.com" },
      });
      fireEvent.change(passwordInputElement, { target: { value: "test-123" } });

      /* Act. */
      const submitButtonElement = screen.getByRole("button", {
        name: "LOG INTO MY ACCOUNT",
      });
      fireEvent.click(submitButtonElement);

      /* Assert. */
      await waitFor(() => {
        screen.getByText("[mocked] Incorrect email and/or password.");
      });
    }
  );

  test(
    "<App> -" +
      " if a user logs in and goes on to hit her browser's Reload button," +
      " the frontend application should continue to display" +
      " a logged-in user's navigation links",
    async () => {
      /*
      This test case and the next one test the same thing.
      
      The difference between the two is as follows:
      this test case is longer (and perhaps more complex)
      but more closely resembles the way
      in which a user would use her browser to interact with the frontend.

      TODO: find out which of the two test cases is better and why!
      */

      /* Arrange. */
      const initState = {
        ...initialState,
      };
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, initState, enhancer);
      const history = createMemoryHistory();

      history.push("/login");

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      const logInAnchor = screen.getByText("Log in");
      fireEvent.click(logInAnchor);

      /* Arrange. */
      const emailInputElement = screen.getByLabelText("EMAIL");
      expect(emailInputElement).toBeInTheDocument();
      const passwordInputElement = screen.getByLabelText("PASSWORD");
      expect(passwordInputElement).toBeInTheDocument();

      fireEvent.change(emailInputElement, {
        target: { value: "test-jd@protonmail.com" },
      });
      fireEvent.change(passwordInputElement, { target: { value: "test-123" } });

      const submitButtonElement = screen.getByRole("button", {
        name: "LOG INTO MY ACCOUNT",
      });
      fireEvent.click(submitButtonElement);

      let temp: HTMLElement;
      await waitFor(() => {
        temp = screen.getByText("Log out");
        expect(temp).toBeInTheDocument();
      });

      /* Act. */
      /* Simulate the user's hitting her browser's Reload button. */
      cleanup();

      const realStoreAfterReload = createStore(
        rootReducer,
        {
          ...initState,
          auth: {
            ...initState.auth,
            token: localStorage.getItem(VOCAB_TREASURY_APP_TOKEN),
          },
        },
        enhancer
      );

      render(
        <Provider store={realStoreAfterReload}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      /* Assert. */
      await waitFor(() => {
        temp = screen.getByText("Own VocabTreasury");
        expect(temp).toBeInTheDocument();
      });
      temp = screen.getByText("Account");
      expect(temp).toBeInTheDocument();
      temp = screen.getByText("Log out");
      expect(temp).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " if a logged-in user hits her browser's Reload button," +
      " the frontend application should continue to display" +
      " a logged-in user's navigation links",
    async () => {
      /*
      This test case and the previous one test the same thing.

      See the "docstring" comment of the previous test case.
      */

      /* Arrange. */
      const initState = {
        ...initialState,
        auth: {
          ...initialStateAuth,
          token: "token-issued-by-the-backend",
          hasValidToken: true,
          loggedInUserProfile: profileMock,
        },
      };
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, initState, enhancer);
      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      let temp: HTMLElement;
      await waitFor(() => {
        temp = screen.getByText("Log out");
        expect(temp).toBeInTheDocument();
      });

      /* Act. */
      /* Simulate the user's hitting her browser's Reload button. */
      cleanup();

      const realStoreAfterReload = createStore(
        rootReducer,
        {
          ...initialState,
          auth: {
            ...initialState.auth,
            token: localStorage.getItem(VOCAB_TREASURY_APP_TOKEN),
          },
        },
        enhancer
      );

      render(
        <Provider store={realStoreAfterReload}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      /* Assert. */
      await waitFor(() => {
        temp = screen.getByText("Own VocabTreasury");
        expect(temp).toBeInTheDocument();
      });
      temp = screen.getByText("Account");
      expect(temp).toBeInTheDocument();
      temp = screen.getByText("Log out");
      expect(temp).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " if the request issued by <App>'s useEffect hook fails," +
      " the user should be (logged out and) prompted to log in",
    async () => {
      /* Arrange. */
      quasiServer.use(
        rest.get("/api/user-profile", (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: "[mocked] Unauthorized",
              message: "[mocked] Expired access token.",
            })
          );
        })
      );

      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);
      const history = createMemoryHistory();

      /* Act. */
      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      /* Assert. */
      let temp: HTMLElement;
      await waitFor(() => {
        temp = screen.getByText("TO CONTINUE, PLEASE LOG IN");
        expect(temp).toBeInTheDocument();
      });
    }
  );
});

// 1
import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";

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

// 3
import { profileMock } from "./dataMocks";

import { App } from "./App";
import { cleanup } from "@testing-library/react";

// 4
import { mockPaginationFromBackend } from "./dataMocks";

import { exampleMock } from "./dataMocks";

import {
  IPaginationMetaFromBackend,
  IPaginationLinks,
  IExampleFromBackend,
  IPaginationMeta,
  IExample,
} from "./store";
import { convertToPaginationInFrontend } from "./helperFunctionsForTesting";

// 5
import { examplesMock } from "./dataMocks";

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
      const element: HTMLElement = await screen.findByText("LOGOUT SUCCESSFUL");
      expect(element).toBeInTheDocument();
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
  test("redirects any logged-in user to /home", () => {
    /* Arrange. */
    const initState: IState = {
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
          <Register />
        </Router>
      </Provider>
    );

    /* Assert. */
    expect(history.location.pathname).toEqual("/home");
  });

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
  test("renders the logged-in user's profile details", () => {
    /* Arrange. */
    const initState = {
      ...initialState,
      auth: {
        ...initialState.auth,
        loggedInUserProfile: {
          id: 17,
          username: "auth-jd",
          email: "auth-john.doe@protonmail.com",
        },
      },
    };
    const realStore = createStore(rootReducer, initState);

    /* Act. */
    render(
      <Provider store={realStore}>
        <Account />
      </Provider>
    );

    /* Assert. */
    for (const text of ["17", "auth-jd", "auth-john.doe@protonmail.com"]) {
      const tableCellElement = screen.getByText(text);
      expect(tableCellElement).toBeInTheDocument();
    }
  });
});

describe("<OwnVocabTreasury> + mocking of HTTP requests to the backend", () => {
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
    "renders a heading, manipulation links," +
      " and a page of the logged-in user's Example resources",
    async () => {
      /* Arrange. */
      const initState: IState = {
        ...initialState,
        auth: {
          ...initialState.auth,
          loggedInUserProfile: {
            id: 17,
            username: "auth-jd",
            email: "auth-john.doe@protonmail.com",
          },
        },
      };
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, initState, enhancer);

      const history = createMemoryHistory();

      /* Act. */
      render(
        <Provider store={realStore}>
          <Router history={history}>
            <OwnVocabTreasury />
          </Router>
        </Provider>
      );

      /* Assert. */
      /* - items that appear above the table of Example resources */
      let element: HTMLElement;
      for (const expectedText of [
        "auth-jd's Own VocabTreasury",
        "Record new example",
        "Search",
      ]) {
        element = screen.getByText(expectedText);
        expect(element).toBeInTheDocument();
      }

      /* - table headers */
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

      /* - after the component's 2nd re-rendering */
      element = await screen.findByText(
        "Building pagination-controlling buttons..."
      );
      expect(element).toBeInTheDocument();

      /* - after the component's 3rd re-rendering: */
      /*    (a) [representations of] Example resources */
      element = await screen.findByText("1");
      expect(element).toBeInTheDocument();

      for (const textFromExample1 of ["sana #1", "lause #1", "käännös #1"]) {
        element = screen.getByText(textFromExample1);
        expect(element).toBeInTheDocument();
      }

      for (const textFromExample2 of [
        "2",
        "sana #2",
        "lause #2",
        "käännös #2",
      ]) {
        element = screen.getByText(textFromExample2);
        expect(element).toBeInTheDocument();
      }

      /*    (b) elements for controlling pagination of Example resources */
      for (const textOnPaginationControllingButton of [
        "First page: 1",
        "Previous page",
        "Next page",
        "Last page: 6",
      ]) {
        console.log("looking for ", textOnPaginationControllingButton);
        element = screen.getByRole("button", {
          name: textOnPaginationControllingButton,
        });
        expect(element).toBeInTheDocument();
      }

      element = screen.getByText("Current page: 1");
      expect(element).toBeInTheDocument();
    }
  );

  test(
    " + <Alerts>" +
      " a GET request to /api/examples is issued as part of the effect function," +
      " but the backend is _mocked_" +
      " to reject the client-provided authentication credential as invalid",
    async () => {
      /*
      TODO: find out whether it would be better practice to convert this test case
            into one that (fits under the
            "multiple components + mocking of HTTP requests to the backend" `describe`
            block and) renders the whole <App>, makes analogous assertions as this test,
            and finally concludes by making the following extra assertion:
              ```
              expect(history.location.pathname).toEqual("/login")
              ```
      */

      /* Arrange. */
      quasiServer.use(
        rest.get("/api/examples", (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({
              error: "[mocked] Unauthorized",
              message: "[mocked] Expired access token.",
            })
          );
        })
      );

      const initState: IState = {
        ...initialState,
        auth: {
          ...initialState.auth,
          loggedInUserProfile: {
            id: 17,
            username: "auth-jd",
            email: "auth-john.doe@protonmail.com",
          },
        },
      };
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, initState, enhancer);

      const history = createMemoryHistory();

      /* Act. */
      render(
        <Provider store={realStore}>
          <Router history={history}>
            <Alerts />
            <OwnVocabTreasury />
          </Router>
        </Provider>
      );

      /* Assert. */
      const element: HTMLElement = await screen.findByText(
        "[FROM <OwnVocabTreasury>'S useEffect HOOK] PLEASE LOG BACK IN"
      );
      expect(element).toBeInTheDocument();
    }
  );
});

describe("<RecordNewExample>", () => {
  test("renders the fields of a form for creating a new Example resource", () => {
    const realStore = createStore(rootReducer);
    render(
      <Provider store={realStore}>
        <RecordNewExample />
      </Provider>
    );

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

  test(
    "+ <Alerts>" +
      " - renders an alert after the user has submitted the form" +
      " without completing all required fields",
    () => {
      /* Arrange. */
      const realStore = createStore(rootReducer);

      render(
        <Provider store={realStore}>
          <Alerts />
          <RecordNewExample />
        </Provider>
      );

      const newWordInputElement = screen.getByLabelText("NEW WORD");
      expect(newWordInputElement).toBeInTheDocument();
      // const exampleInputElement = screen.getByLabelText("EXAMPLE");
      // expect(exampleInputElement).toBeInTheDocument();

      fireEvent.change(newWordInputElement, {
        target: { value: "test-new-word" },
      });
      // fireEvent.change(exampleInputElement, {
      //   target: { value: "test-example" },
      // });

      /* Act. */
      const submitButtonElement = screen.getByRole("button", {
        name: "RECORD THIS EXAMPLE",
      });
      fireEvent.click(submitButtonElement);

      /* Assert. */
      screen.getByText(
        "YOU MUST FILL OUT THE FOLLOWING FORM FIELDS: NEW WORD, EXAMPLE"
      );
    }
  );
});

describe("<SingleExample>", () => {
  test(
    "renders a specific Example resource" +
      " and HTML elements that enable user interaction",
    () => {
      /* Arrange. */
      const perPage: number = 2;
      const page: number = 1;

      const paginationFromBackend: {
        _meta: IPaginationMetaFromBackend;
        _links: IPaginationLinks;
        items: IExampleFromBackend[];
      } = mockPaginationFromBackend(examplesMock, perPage, page);
      const {
        meta,
        links,
        ids,
        entities,
      }: {
        meta: IPaginationMeta;
        links: IPaginationLinks;
        ids: number[];
        entities: { [exampleId: string]: IExample };
      } = convertToPaginationInFrontend(paginationFromBackend);

      const initState: IState = {
        ...initialState,
        examples: {
          ...initialState.examples,
          meta,
          links,
          ids,
          entities,
        },
      };
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, initState, enhancer);

      const history = createMemoryHistory();
      history.push("/example/2");

      /* Arrange. */
      render(
        <Provider store={realStore}>
          <Router history={history}>
            <Route exact path="/example/:id">
              <SingleExample />
            </Route>
          </Router>
        </Provider>
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
      const idTableCellElement2 = screen.getByText("2");
      expect(idTableCellElement2).toBeInTheDocument();

      const sourceLanguageTableCellElement2 = screen.getByText("Finnish");
      expect(sourceLanguageTableCellElement2).toBeInTheDocument();

      const newWordTableCellElement2 = screen.getByText("sana #2");
      expect(newWordTableCellElement2).toBeInTheDocument();

      const exampleTableCellElement2 = screen.getByText("lause #2");
      expect(exampleTableCellElement2).toBeInTheDocument();

      const translationTableCellElement2 = screen.getByText("käännös #2");
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

    const newWordTableCellElement2 = screen.getByDisplayValue("varjo");
    expect(newWordTableCellElement2).toBeInTheDocument();

    const exampleTableCellElement2 = screen.getByDisplayValue(
      "Suomen ideaalisää on 24 astetta varjossa."
    );
    expect(exampleTableCellElement2).toBeInTheDocument();

    const translationTableCellElement2 = screen.getByDisplayValue(
      "Finland's ideal weather is 24 degrees in the shade."
    );
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

  rest.get("/api/examples", (req, res, ctx) => {
    const perPage: number = 2;
    const page = parseInt(req.url.searchParams.get("page") || "1");

    return res(
      ctx.status(200),
      ctx.json(mockPaginationFromBackend(examplesMock, perPage, page))
    );
  }),

  rest.post("/api/examples", (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(exampleMock));
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
      const element: HTMLElement = await screen.findByText(
        "REGISTRATION SUCCESSFUL"
      );
      expect(element).toBeInTheDocument();
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
      const element: HTMLElement = await screen.findByText(
        "[mocked-response] Failed to create a new User resource"
      );
      expect(element).toBeInTheDocument();
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
      const element: HTMLElement = await screen.findByText("LOGIN SUCCESSFUL");
      expect(element).toBeInTheDocument();

      expect(history.location.pathname).toEqual("/home");
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
      const element: HTMLElement = await screen.findByText(
        "[mocked] Incorrect email and/or password."
      );
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " if a user logs in and goes on to hit her browser's Reload button," +
      " the frontend application should continue to display" +
      " a logged-in user's navigation links",
    async () => {
      /* Arrange. */
      const initState = {
        ...initialState,
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

      /* Arrange. */
      const logInAnchor = screen.getByText("Log in");
      fireEvent.click(logInAnchor);

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

      temp = await screen.findByText("Log out");
      expect(temp).toBeInTheDocument();

      /* Act. */
      /* Simulate the user's hitting her browser's Reload button. */
      cleanup();

      const realStoreAfterReload = createStore(
        rootReducer,
        {
          ...initState,
          auth: {
            ...initState.auth,
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
      temp = await screen.findByText("Own VocabTreasury");
      expect(temp).toBeInTheDocument();

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
      const temp: HTMLElement = await screen.findByText(
        "TO CONTINUE, PLEASE LOG IN"
      );
      expect(temp).toBeInTheDocument();
    }
  );

  test(
    "(<App> >>) <PrivateRoute> renders based on its 1st condition -" +
      " if the request issued by <App>'s useEffect hook succeeds," +
      " the user's clicking on the 'Account' navigation link" +
      " should navigate to the <PrivateRoute>, which wraps <Account>",
    async () => {
      /* Arrange. */
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);
      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      /* Act. */
      const accountAnchor = await screen.findByText("Account");
      fireEvent.click(accountAnchor);

      /* Assert. */
      expect(history.location.pathname).toEqual("/account");
    }
  );

  test(
    "(<App> >>) <PrivateRoute> renders based on its 2nd condition -" +
      " if a user hasn't logged in" +
      " but manually changes the URL in her browser's address bar" +
      " to /account ," +
      " the frontend application should redirect the user to /login",
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

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      let temp: HTMLElement;

      temp = await screen.findByText("TO CONTINUE, PLEASE LOG IN");
      expect(temp).toBeInTheDocument();

      expect(history.location.pathname).toEqual("/");

      /* Act. */
      /* Simulate the user's manually changing the URL in her browser's address bar. */
      cleanup();

      history.push("/account");

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      /* Assert. */
      expect(history.location.pathname).toEqual("/login");

      temp = await screen.findByText("TO CONTINUE, PLEASE LOG IN");
      expect(temp).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " the user clicks the navigation-controlling button for 'Next page'",
    async () => {
      /* Arrange. */
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);

      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      const anchorToOwnVocabTreasury = await screen.findByText(
        "Own VocabTreasury"
      );
      fireEvent.click(anchorToOwnVocabTreasury);

      /* Act. */
      const paginationCtrlBtnNext = await screen.findByRole("button", {
        name: "Next page",
      });
      fireEvent.click(paginationCtrlBtnNext);

      /* Assert. */
      /*    (a) [representations of] Example resources */
      let element: HTMLElement;
      element = await screen.findByText("3");
      expect(element).toBeInTheDocument();

      for (const textFromExample3 of ["sana #3", "lause #3", "käännös #3"]) {
        element = screen.getByText(textFromExample3);
        expect(element).toBeInTheDocument();
      }

      for (const textFromExample4 of [
        "4",
        "sana #4",
        "lause #4",
        "käännös #4",
      ]) {
        element = screen.getByText(textFromExample4);
        expect(element).toBeInTheDocument();
      }

      /*    (b) elements for controlling pagination of Example resources */
      element = screen.getByText("Current page: 2");
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " the user clicks the navigation-controlling button for 'Last page: N'",
    async () => {
      /* Arrange. */
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);

      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      const anchorToOwnVocabTreasury = await screen.findByText(
        "Own VocabTreasury"
      );
      fireEvent.click(anchorToOwnVocabTreasury);

      /* Act. */
      const paginationCtrlBtnNext = await screen.findByRole("button", {
        name: "Last page: 6",
      });
      fireEvent.click(paginationCtrlBtnNext);

      /* Assert. */
      /*    (a) [representations of] Example resources */
      let element: HTMLElement;
      element = await screen.findByText("11");
      expect(element).toBeInTheDocument();

      for (const textFromExample11 of [
        "sana #11",
        "lause #11",
        "käännös #11",
      ]) {
        element = screen.getByText(textFromExample11);
        expect(element).toBeInTheDocument();
      }

      /*    (b) elements for controlling pagination of Example resources */
      element = screen.getByText("Current page: 6");
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " the user clicks first the navigation-controlling button for 'Last page: N'" +
      " and then that for 'Previous page'",
    async () => {
      /* Arrange. */
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);

      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      const anchorToOwnVocabTreasury = await screen.findByText(
        "Own VocabTreasury"
      );
      fireEvent.click(anchorToOwnVocabTreasury);

      /* Act. */
      const paginationCtrlBtnNext = await screen.findByRole("button", {
        name: "Last page: 6",
      });
      fireEvent.click(paginationCtrlBtnNext);

      let element: HTMLElement;
      element = await screen.findByText("Current page: 6");

      const paginationCtrlBtnPrev = await screen.findByRole("button", {
        name: "Previous page",
      });
      fireEvent.click(paginationCtrlBtnPrev);

      /* Assert. */
      /*    (a) [representations of] Example resources */
      element = await screen.findByText("9");
      expect(element).toBeInTheDocument();

      for (const textFromExample9 of ["sana #9", "lause #9", "käännös #9"]) {
        element = screen.getByText(textFromExample9);
        expect(element).toBeInTheDocument();
      }

      for (const textFromExample10 of [
        "10",
        "sana #10",
        "lause #10",
        "käännös #10",
      ]) {
        element = screen.getByText(textFromExample10);
        expect(element).toBeInTheDocument();
      }

      /*    (b) elements for controlling pagination of Example resources */
      element = screen.getByText("Current page: 5");
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " the user clicks first the navigation-controlling button for 'Next page'" +
      " and then that for 'First page: 1'",
    async () => {
      /* Arrange. */
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);

      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      const anchorToOwnVocabTreasury = await screen.findByText(
        "Own VocabTreasury"
      );
      fireEvent.click(anchorToOwnVocabTreasury);

      /* Act. */
      const paginationCtrlBtnNext = await screen.findByRole("button", {
        name: "Next page",
      });
      fireEvent.click(paginationCtrlBtnNext);

      let element: HTMLElement;
      element = await screen.findByText("Current page: 2");

      const paginationCtrlBtnFirst = await screen.findByRole("button", {
        name: "First page: 1",
      });
      fireEvent.click(paginationCtrlBtnFirst);

      /* Assert. */
      /*    (a) [representations of] Example resources */
      element = await screen.findByText("1");
      expect(element).toBeInTheDocument();

      for (const textFromExample1 of ["sana #1", "lause #1", "käännös #1"]) {
        element = screen.getByText(textFromExample1);
        expect(element).toBeInTheDocument();
      }

      for (const textFromExample2 of [
        "2",
        "sana #2",
        "lause #2",
        "käännös #2",
      ]) {
        element = screen.getByText(textFromExample2);
        expect(element).toBeInTheDocument();
      }

      /*    (b) elements for controlling pagination of Example resources */
      element = screen.getByText("Current page: 1");
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " the user fills out the form on /example/new and submits it," +
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
            <App />
          </Router>
        </Provider>
      );

      const anchorToOwnVocabTreasury = await screen.findByText(
        "Own VocabTreasury"
      );
      fireEvent.click(anchorToOwnVocabTreasury);

      const anchorToRecordNewExample = await screen.findByText(
        "Record new example"
      );
      fireEvent.click(anchorToRecordNewExample);

      /* Act. */
      const newWordInputElement = await screen.findByLabelText("NEW WORD");
      expect(newWordInputElement).toBeInTheDocument();
      const exampleInputElement = screen.getByLabelText("EXAMPLE");
      expect(exampleInputElement).toBeInTheDocument();

      fireEvent.change(newWordInputElement, {
        target: { value: "test-word" },
      });
      fireEvent.change(exampleInputElement, {
        target: { value: "test-example" },
      });

      const submitButtonElement = screen.getByRole("button", {
        name: "RECORD THIS EXAMPLE",
      });
      fireEvent.click(submitButtonElement);

      /* Assert. */
      const element: HTMLElement = await screen.findByText(
        "EXAMPLE CREATION SUCCESSFUL"
      );
      expect(element).toBeInTheDocument();

      await waitFor(() => {
        expect(history.location.pathname).toEqual("/own-vocabtreasury");
      });
    }
  );

  test(
    "<App> -" +
      " the user fills out the form on /example/new and submits it," +
      " but the backend is _mocked_ to respond that" +
      " the form submission was determined to be invalid",
    async () => {
      /* Arrange. */
      quasiServer.use(
        rest.post("/api/examples", (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({
              error: "[mocked] Bad Request",
              message: "[mocked] Failed to create a new Example resource.",
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
            <App />
          </Router>
        </Provider>
      );

      const anchorToOwnVocabTreasury = await screen.findByText(
        "Own VocabTreasury"
      );
      fireEvent.click(anchorToOwnVocabTreasury);

      const anchorToRecordNewExample = await screen.findByText(
        "Record new example"
      );
      fireEvent.click(anchorToRecordNewExample);

      /* Act. */
      const newWordInputElement = await screen.findByLabelText("NEW WORD");
      expect(newWordInputElement).toBeInTheDocument();
      const contentInputElement = screen.getByLabelText("EXAMPLE");
      expect(contentInputElement).toBeInTheDocument();

      fireEvent.change(newWordInputElement, {
        target: { value: "test-word" },
      });
      fireEvent.change(contentInputElement, {
        target: { value: "test-content" },
      });

      const submitButtonElement = screen.getByRole("button", {
        name: "RECORD THIS EXAMPLE",
      });
      fireEvent.click(submitButtonElement);

      /* Assert. */
      const element: HTMLElement = await screen.findByText(
        "[mocked] Failed to create a new Example resource."
      );
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " the user fills out the form on /example/new and submits it," +
      " but the backend is _mocked_ to respond that" +
      " the user's access token has expired",
    async () => {
      /* Arrange. */
      quasiServer.use(
        rest.post("/api/examples", (req, res, ctx) => {
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

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      const anchorToOwnVocabTreasury = await screen.findByText(
        "Own VocabTreasury"
      );
      fireEvent.click(anchorToOwnVocabTreasury);

      const anchorToRecordNewExample = await screen.findByText(
        "Record new example"
      );
      fireEvent.click(anchorToRecordNewExample);

      /* Act. */
      const newWordInputElement = await screen.findByLabelText("NEW WORD");
      expect(newWordInputElement).toBeInTheDocument();
      const contentInputElement = screen.getByLabelText("EXAMPLE");
      expect(contentInputElement).toBeInTheDocument();

      fireEvent.change(newWordInputElement, {
        target: { value: "test-word" },
      });
      fireEvent.change(contentInputElement, {
        target: { value: "test-content" },
      });

      /*
      The remaining "Act" statements are not really necessary for this test case,
      but they increase the test suite's code coverage.
      */
      const sourceLanguageInputElement =
        screen.getByLabelText("SOURCE LANGUAGE");
      expect(sourceLanguageInputElement).toBeInTheDocument();
      const contentTranslationInputElement =
        screen.getByLabelText("TRANSLATION");
      expect(contentTranslationInputElement).toBeInTheDocument();

      fireEvent.change(sourceLanguageInputElement, {
        target: { value: "test-source-language" },
      });
      fireEvent.change(contentTranslationInputElement, {
        target: { value: "test-content-translation" },
      });

      const submitButtonElement = screen.getByRole("button", {
        name: "RECORD THIS EXAMPLE",
      });
      fireEvent.click(submitButtonElement);

      /* Assert. */
      const element: HTMLElement = await screen.findByText(
        "TO CONTINUE, PLEASE LOG IN"
      );
      expect(element).toBeInTheDocument();

      expect(history.location.pathname).toEqual("/login");
    }
  );

  test(
    "<App> -" +
      " if a logged-in user (a) clicks on 'Own VocabTreasury'," +
      " (b) navigates to a page [of examples] different from page 1," +
      " and (c) clicks on one of that page's examples," +
      " then by clicking on 'Return to this example within my Own VocabTreasury'" +
      " the user should be navigated back to the same page [of examples]",
    async () => {
      /* Arrange. */
      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);

      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      const anchorToOwnVocabTreasury = await screen.findByText(
        "Own VocabTreasury"
      );
      fireEvent.click(anchorToOwnVocabTreasury);

      /* Act. */
      const nextPageButtonElement: HTMLElement = await screen.findByRole(
        "button",
        {
          name: "Next page",
        }
      );
      fireEvent.click(nextPageButtonElement);

      const exampleOnPage2AnchorElement: HTMLElement = await screen.findByText(
        "4"
      );
      fireEvent.click(exampleOnPage2AnchorElement);

      const returnToOwnVocabTreasuryAnchorElement: HTMLElement =
        screen.getByText("Return to this example within my Own VocabTreasury");
      fireEvent.click(returnToOwnVocabTreasuryAnchorElement);

      /* Assert. */
      /* - wait for the same page [of examples] to be rendered */
      const currentPageSpanElement: HTMLElement = await screen.findByText(
        "Current page: 2"
      );
      expect(currentPageSpanElement).toBeInTheDocument();

      const newWord3TableCellElement: HTMLElement = screen.getByText("sana #3");
      expect(newWord3TableCellElement).toBeInTheDocument();

      const newWord4TableCellElement: HTMLElement = screen.getByText("sana #4");
      expect(newWord4TableCellElement).toBeInTheDocument();

      /*
      - ensure that the page [of examples], which is now rendered,
      will not be removed
      */
      const p = waitForElementToBeRemoved(() =>
        screen.queryByText("Current page: 2")
      );

      await expect(p).rejects.toThrowError(
        /Timed out in waitForElementToBeRemoved/
      );
    }
  );

  test(
    "<App> -" +
      " if a logged-in user (a) clicks on 'Own VocabTreasury'," +
      " (b) navigates to the 1st page [of examples]," +
      " and (c) clicks on one of that page's examples," +
      " then by clicking on 'Delete this example'" +
      " the user should be navigated back to the same page [of examples]",
    async () => {
      /* Arrange. */
      console.log("starting with examplesMock");
      console.log(examplesMock);
      const examplesMockCopy = [...examplesMock];

      quasiServer.use(
        rest.get("/api/examples", (req, res, ctx) => {
          const perPage: number = 2;
          const page = parseInt(req.url.searchParams.get("page") || "1");

          return res(
            ctx.status(200),
            ctx.json(mockPaginationFromBackend(examplesMockCopy, perPage, page))
          );
        }),

        rest.delete("/api/examples/:id", (req, res, ctx) => {
          const exampleId: number = parseInt(req.params.id);
          const exampleIndex: number = examplesMockCopy.findIndex(
            (e: IExampleFromBackend) => e.id === exampleId
          );

          examplesMockCopy.splice(exampleIndex, 1);

          console.log("after deletion, examplesMockCopy:");
          console.log(examplesMockCopy);

          return res(ctx.status(204));
        })
      );

      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);

      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      const anchorToOwnVocabTreasury = await screen.findByText(
        "Own VocabTreasury"
      );
      fireEvent.click(anchorToOwnVocabTreasury);

      /* Act. */
      const anchorToExample1: HTMLElement = await screen.findByText("1");
      expect(anchorToExample1).toBeInTheDocument();
      fireEvent.click(anchorToExample1);

      const deleteThisExampleBtn: HTMLElement = await screen.findByRole(
        "button",
        { name: "Delete this example" }
      );
      fireEvent.click(deleteThisExampleBtn);

      /* Assert. */
      let element: HTMLElement;
      element = await screen.findByText("Current page: 1");
      expect(element).toBeInTheDocument();

      element = screen.getByText("lause #2");
      expect(element).toBeInTheDocument();

      element = screen.getByText("lause #3");
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " if a logged-in user (a) clicks on 'Own VocabTreasury'," +
      " (b) navigates to the last page [of examples]" +
      " and there is only 1 example on that page," +
      " and (c) clicks that single example," +
      " then by clicking on 'Delete this example'" +
      " the user should be navigated back to the last page [of examples]",
    async () => {
      /* Arrange. */
      const examplesMockCopy = [...examplesMock];

      quasiServer.use(
        rest.get("/api/examples", (req, res, ctx) => {
          const perPage: number = 2;
          const page = parseInt(req.url.searchParams.get("page") || "1");

          return res(
            ctx.status(200),
            ctx.json(mockPaginationFromBackend(examplesMockCopy, perPage, page))
          );
        }),

        rest.delete("/api/examples/:id", (req, res, ctx) => {
          const exampleId: number = parseInt(req.params.id);
          const exampleIndex: number = examplesMockCopy.findIndex(
            (e: IExampleFromBackend) => e.id === exampleId
          );

          examplesMockCopy.splice(exampleIndex, 1);

          return res(ctx.status(204));
        })
      );

      const enhancer = applyMiddleware(thunkMiddleware);
      const realStore = createStore(rootReducer, enhancer);

      const history = createMemoryHistory();

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      const anchorToOwnVocabTreasury = await screen.findByText(
        "Own VocabTreasury"
      );
      fireEvent.click(anchorToOwnVocabTreasury);

      const lastPageButton = await screen.findByRole("button", {
        name: "Last page: 6",
      });
      fireEvent.click(lastPageButton);

      /* Act. */
      const anchorToExample11: HTMLElement = await screen.findByText("11");
      expect(anchorToExample11).toBeInTheDocument();
      fireEvent.click(anchorToExample11);

      const deleteThisExampleBtn: HTMLElement = await screen.findByRole(
        "button",
        { name: "Delete this example" }
      );
      fireEvent.click(deleteThisExampleBtn);

      /* Assert. */
      let element: HTMLElement;
      element = await screen.findByText("Current page: 5");
      expect(element).toBeInTheDocument();

      element = screen.getByText("lause #9");
      expect(element).toBeInTheDocument();

      element = screen.getByText("lause #10");
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " if a logged-in user (a) clicks on 'Own VocabTreasury'" +
      " and (b) clicks on some example," +
      " but (c) the user's access token has expired," +
      " then by clicking on 'Delete this example' the user gets logged out",
    async () => {
      quasiServer.use(
        rest.delete("/api/examples/:id", (req, res, ctx) => {
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

      render(
        <Provider store={realStore}>
          <Router history={history}>
            <App />
          </Router>
        </Provider>
      );

      const anchorToOwnVocabTreasury = await screen.findByText(
        "Own VocabTreasury"
      );
      fireEvent.click(anchorToOwnVocabTreasury);

      /* Act. */
      const anchorToExample1: HTMLElement = await screen.findByText("1");
      expect(anchorToExample1).toBeInTheDocument();
      fireEvent.click(anchorToExample1);

      const deleteThisExampleBtn: HTMLElement = await screen.findByRole(
        "button",
        {
          name: "Delete this example",
        }
      );
      fireEvent.click(deleteThisExampleBtn);

      /* Assert. */
      let element: HTMLElement;
      element = await screen.findByText("TO CONTINUE, PLEASE LOG IN");
      expect(element).toBeInTheDocument();

      element = screen.getByText("Log in");
      expect(element).toBeInTheDocument();

      expect(history.location.pathname).toEqual("/login");
    }
  );
});

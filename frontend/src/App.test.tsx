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

import { IState, INITIAL_STATE, rootReducer } from "./store";
import {
  NavigationBar,
  Home,
  About,
  Login,
  Account,
  OwnVocabTreasury,
  RecordNewExample,
  SingleExample,
} from "./App";
import { Alerts } from "./features/alerts/Alerts";

// 2
import {
  DefaultRequestBody,
  RequestParams,
  ResponseComposition,
  rest,
  RestContext,
  RestRequest,
} from "msw";
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

import { requestHandlers } from "./testHelpers";

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
      ...INITIAL_STATE,
      auth: {
        ...INITIAL_STATE.auth,
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
        ...INITIAL_STATE,
        auth: {
          ...INITIAL_STATE.auth,
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

describe("<About>", () => {
  test("renders an 'About VocabTreasury...' message", () => {
    render(<About />);
    const headingElement = screen.getByText("About VocabTreasury...");
    expect(headingElement).toBeInTheDocument();
  });
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

describe("<Account>", () => {
  test("renders the logged-in user's profile details", () => {
    /* Arrange. */
    const initState = {
      ...INITIAL_STATE,
      auth: {
        ...INITIAL_STATE.auth,
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
        ...INITIAL_STATE,
        auth: {
          ...INITIAL_STATE.auth,
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
      /* - after the component's rendering: */
      /*    (a) items that appear above the table of Example resources */
      let element: HTMLElement;
      for (const expectedText of [
        "auth-jd's Own VocabTreasury",
        "Record new example",
        "Search",
      ]) {
        element = screen.getByText(expectedText);
        expect(element).toBeInTheDocument();
      }

      /*    (b) elements for controlling pagination of Example resources */
      console.log(`${new Date().toISOString()} - 1st run of screen.debug()`);
      screen.debug();

      element = screen.getByText("Building pagination-controlling buttons...");
      expect(element).toBeInTheDocument();

      /*    (c) table headers */
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

      /* - after the component's re-rendering: */
      /*    (a) [representations of] Example resources */
      element = await screen.findByText("1");

      console.log(`${new Date().toISOString()} - 2nd run of screen.debug()`);
      screen.debug();

      expect(element).toBeInTheDocument();

      for (const textFromExample1 of [
        "sana numero-1",
        "lause numero-1",
        "käännös numero-1",
      ]) {
        element = screen.getByText(textFromExample1);
        expect(element).toBeInTheDocument();
      }

      for (const textFromExample2 of [
        "2",
        "sana numero-2",
        "lause numero-2",
        "käännös numero-2",
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
        ...INITIAL_STATE,
        auth: {
          ...INITIAL_STATE.auth,
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
        ...INITIAL_STATE,
        examples: {
          ...INITIAL_STATE.examples,
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

      const newWordTableCellElement2 = screen.getByText("sana numero-2");
      expect(newWordTableCellElement2).toBeInTheDocument();

      const exampleTableCellElement2 = screen.getByText("lause numero-2");
      expect(exampleTableCellElement2).toBeInTheDocument();

      const translationTableCellElement2 = screen.getByText("käännös numero-2");
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

/* Describe what requests should be mocked. */
const requestHandlersToMock = [
  rest.post("/api/users", requestHandlers.mockCreateUser),
  rest.post("/api/tokens", requestHandlers.mockIssueJWSToken),
  rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),
  rest.get(
    "/api/examples",
    (
      req: RestRequest<DefaultRequestBody, RequestParams>,
      res: ResponseComposition<any>,
      ctx: RestContext
    ) => {
      const perPage: number = 2;
      const page = parseInt(req.url.searchParams.get("page") || "1");

      const newWord = req.url.searchParams.get("new_word");
      const content = req.url.searchParams.get("content");
      const contentTranslation = req.url.searchParams.get(
        "content_translation"
      );

      const possiblyFilteredExamples: IExampleFromBackend[] =
        examplesMock.filter((e: IExampleFromBackend) => {
          let isMatch: boolean = true;

          if (newWord !== null) {
            isMatch =
              isMatch &&
              e.new_word.toLowerCase().search(newWord.toLowerCase()) !== -1;
          }
          if (content !== null) {
            isMatch =
              isMatch &&
              e.content.toLowerCase().search(content.toLowerCase()) !== -1;
          }
          if (contentTranslation !== null) {
            isMatch =
              isMatch &&
              e.content_translation
                .toLowerCase()
                .search(contentTranslation.toLowerCase()) !== -1;
          }

          return isMatch;
        });

      return res(
        ctx.status(200),
        ctx.json(
          mockPaginationFromBackend(
            possiblyFilteredExamples,
            perPage,
            page,
            newWord,
            content,
            contentTranslation
          )
        )
      );
    }
  ),

  rest.post("/api/examples", (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(exampleMock));
  }),

  rest.post("/api/request-password-reset", (req, res, ctx) => {
    return res(
      ctx.status(202),
      ctx.json({
        message:
          "Sending an email with instructions for resetting your password...",
      })
    );
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
        ...INITIAL_STATE,
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
      /*
      Simulate the user's hitting her browser's Reload button.
      
      (Note that the purpose of defining and using `realStoreAfterReload` as done below
      is purely illustrative,
      because the subsequent call to `render` dispatches a `fetchProfile()` thunk-action
      whose HTTP request will be intercepted and mocked/handled by `quasiServer`.)
      */
      cleanup();

      const realStoreAfterReload = createStore(
        rootReducer,
        {
          ...INITIAL_STATE,
          auth: {
            ...INITIAL_STATE.auth,
            token: realStore.getState().auth.token,
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

      for (const textFromExample3 of [
        "sana numero-3",
        "lause numero-3",
        "käännös numero-3",
      ]) {
        element = screen.getByText(textFromExample3);
        expect(element).toBeInTheDocument();
      }

      for (const textFromExample4 of [
        "4",
        "sana numero-4",
        "lause numero-4",
        "käännös numero-4",
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
        "sana numero-11",
        "lause numero-11",
        "käännös numero-11",
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

      for (const textFromExample9 of [
        "sana numero-9",
        "lause numero-9",
        "käännös numero-9",
      ]) {
        element = screen.getByText(textFromExample9);
        expect(element).toBeInTheDocument();
      }

      for (const textFromExample10 of [
        "10",
        "sana numero-10",
        "lause numero-10",
        "käännös numero-10",
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

      for (const textFromExample1 of [
        "sana numero-1",
        "lause numero-1",
        "käännös numero-1",
      ]) {
        element = screen.getByText(textFromExample1);
        expect(element).toBeInTheDocument();
      }

      for (const textFromExample2 of [
        "2",
        "sana numero-2",
        "lause numero-2",
        "käännös numero-2",
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

      const newWord3TableCellElement: HTMLElement =
        screen.getByText("sana numero-3");
      expect(newWord3TableCellElement).toBeInTheDocument();

      const newWord4TableCellElement: HTMLElement =
        screen.getByText("sana numero-4");
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

      element = screen.getByText("lause numero-2");
      expect(element).toBeInTheDocument();

      element = screen.getByText("lause numero-3");
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

      element = screen.getByText("lause numero-9");
      expect(element).toBeInTheDocument();

      element = screen.getByText("lause numero-10");
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " suppose that a logged-in user (a) clicks on 'Own VocabTreasury'" +
      " and (b) clicks on some example;" +
      " if the user's access token expires" +
      " and then the user clicks on 'Delete this example'," +
      " the user gets logged out",
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

  test(
    "<App>" +
      " - if a logged-in user selects one of her examples and edits it successfully," +
      " the user should be re-directed to /own-vocabtreasury" +
      " (and, more specifically, to the page containing the selected example)" +
      " and the edited example should be displayed there",
    async () => {
      /* Arrange. */
      const examplesMockCopy = [...examplesMock];

      // Describe the shape of the "req.body".
      interface PutRequestBody {
        source_language: string | null;
        new_word: string | null;
        content: string | null;
        content_translation: string | null;
      }

      // Describe the shape of the mocked response body.
      interface PutResponseBody {
        id: number;
        source_language: string;
        new_word: string;
        content: string;
        content_translation: string;
      }

      // Describe the shape of the "req.params".
      interface PutRequestParams {
        id: string;
      }

      quasiServer.use(
        rest.get("/api/examples", (req, res, ctx) => {
          const perPage: number = 2;
          const page = parseInt(req.url.searchParams.get("page") || "1");

          return res(
            ctx.status(200),
            ctx.json(mockPaginationFromBackend(examplesMockCopy, perPage, page))
          );
        }),

        rest.put<PutRequestBody, PutResponseBody, PutRequestParams>(
          "/api/examples/:id",
          (req, res, ctx) => {
            const exampleId: number = parseInt(req.params.id);
            const exampleIndex: number = examplesMockCopy.findIndex(
              (e: IExampleFromBackend) => e.id === exampleId
            );

            const editedExample: IExampleFromBackend = {
              ...examplesMockCopy[exampleIndex],
            };
            const { source_language, new_word, content, content_translation } =
              req.body;
            if (source_language !== null) {
              editedExample.source_language = source_language;
            }
            if (new_word !== null) {
              editedExample.new_word = new_word;
            }
            if (content !== null) {
              editedExample.content = content;
            }
            if (content_translation !== null) {
              editedExample.content_translation = content_translation;
            }

            examplesMockCopy[exampleIndex] = editedExample;

            return res(ctx.status(200), ctx.json(editedExample));
          }
        )
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

      const anchorToExample1: HTMLElement = await screen.findByText("1");
      expect(anchorToExample1).toBeInTheDocument();
      fireEvent.click(anchorToExample1);

      const editThisExampleAnchor: HTMLElement = await screen.findByText(
        "Edit this example"
      );
      fireEvent.click(editThisExampleAnchor);

      /* Act. */
      const sourceLanguageInputElement: HTMLElement =
        await screen.findByLabelText("SOURCE LANGUAGE");
      const newWordInputElement: HTMLElement =
        screen.getByLabelText("NEW WORD");
      const exampleInputElement: HTMLElement = screen.getByLabelText("EXAMPLE");
      const translationInputElement: HTMLElement =
        screen.getByLabelText("TRANSLATION");

      fireEvent.change(sourceLanguageInputElement, {
        target: { value: "German" },
      });
      fireEvent.change(newWordInputElement, {
        target: { value: "Wort numero-1" },
      });
      fireEvent.change(exampleInputElement, {
        target: { value: "Satz numero-1" },
      });
      fireEvent.change(translationInputElement, {
        target: { value: "Übersetzung numero-1" },
      });

      const editExampleBtn: HTMLElement = screen.getByRole("button", {
        name: "EDIT THIS EXAMPLE",
      });
      fireEvent.click(editExampleBtn);

      /* Assert. */
      let element: HTMLElement;
      element = await screen.findByText("EXAMPLE EDITING SUCCESSFUL");
      expect(element).toBeInTheDocument();

      await waitFor(() => {
        expect(history.location.pathname).toEqual("/own-vocabtreasury");
      });

      element = await screen.findByText("Current page: 1");
      expect(element).toBeInTheDocument();

      element = screen.getByText("Wort numero-1");
      expect(element).toBeInTheDocument();
      element = screen.getByText("Satz numero-1");
      expect(element).toBeInTheDocument();
      element = screen.getByText("Übersetzung numero-1");
      expect(element).toBeInTheDocument();

      element = screen.getByText("sana numero-2");
      expect(element).toBeInTheDocument();
      element = screen.getByText("lause numero-2");
      expect(element).toBeInTheDocument();
      element = screen.getByText("käännös numero-2");
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App>" +
      " - if a logged-in user selects one of her examples" +
      " and edits it in an invalid way," +
      " an alert about the error should be created",
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

      const anchorToExample1: HTMLElement = await screen.findByText("1");
      expect(anchorToExample1).toBeInTheDocument();
      fireEvent.click(anchorToExample1);

      const editThisExampleAnchor: HTMLElement = await screen.findByText(
        "Edit this example"
      );
      fireEvent.click(editThisExampleAnchor);

      /* Act. */
      const newWordInputElement: HTMLElement = await screen.findByLabelText(
        "NEW WORD"
      );

      fireEvent.change(newWordInputElement, {
        target: { value: "" },
      });

      const editExampleBtn: HTMLElement = screen.getByRole("button", {
        name: "EDIT THIS EXAMPLE",
      });
      fireEvent.click(editExampleBtn);

      /* Assert. */
      const element: HTMLElement = await screen.findByText(
        "YOU MUST FILL OUT THE FOLLOWING FORM FIELDS: NEW WORD, EXAMPLE"
      );
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " suppose that a logged-in user (a) selects one of her examples" +
      " and (b) clicks on the 'Edit this example' link;" +
      " if the user's access token expires" +
      " and then the user clicks on 'EDIT THIS EXAMPLE'," +
      " the user should get logged out",
    async () => {
      /* Arrange. */
      quasiServer.use(
        rest.put("/api/examples/:id", (req, res, ctx) => {
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

      const anchorToExample1: HTMLElement = await screen.findByText("1");
      expect(anchorToExample1).toBeInTheDocument();
      fireEvent.click(anchorToExample1);

      const editThisExampleAnchor: HTMLElement = await screen.findByText(
        "Edit this example"
      );
      fireEvent.click(editThisExampleAnchor);

      /* Act. */
      const editExampleBtn: HTMLElement = screen.getByRole("button", {
        name: "EDIT THIS EXAMPLE",
      });
      fireEvent.click(editExampleBtn);

      /* Assert. */
      let element: HTMLElement;
      element = await screen.findByText("TO CONTINUE, PLEASE LOG IN");
      expect(element).toBeInTheDocument();

      expect(history.location.pathname).toEqual("/login");
    }
  );

  test(
    "<App> -" +
      " if a logged-in user searches her Own VocabTreasury for matching examples," +
      " a table of matching examples should be rendered," +
      " together with pagination-controlling buttons that can be used",
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

      const anchorToSearch = screen.getByText("Search");
      fireEvent.click(anchorToSearch);

      /* Act. */
      const newWordInputElement: HTMLElement =
        screen.getByLabelText("NEW WORD");

      fireEvent.change(newWordInputElement, {
        target: { value: "sana numero-1" },
      });

      const searchButton: HTMLElement = screen.getByText("SEARCH");
      fireEvent.click(searchButton);

      /* Assert. */
      let element: HTMLElement;
      element = await screen.findByText("sana numero-10");
      expect(element).toBeInTheDocument();

      element = screen.getByText("sana numero-1");
      expect(element).toBeInTheDocument();

      element = screen.getByText("Current page: 1");
      expect(element).toBeInTheDocument();

      const lastPageButton: HTMLElement = screen.getByRole("button", {
        name: "Last page: 2",
      });
      expect(lastPageButton).toBeInTheDocument();

      /* Act. */
      fireEvent.click(lastPageButton);

      element = await screen.findByText("sana numero-11");
      expect(element).toBeInTheDocument();

      element = screen.getByText("Current page: 2");
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " suppose that a logged-in user (a) clicks on Own VocabTreasury" +
      " and (b) clicks on the Search anchor tag;" +
      " if the user's access token expires" +
      " and then the user submits the 'search form' by clicking 'SEARCH'," +
      " the user gets logged out",
    async () => {
      /* Arrange. */
      quasiServer.use(
        rest.get("/api/examples", (req, res, ctx) => {
          const perPage: number = 2;
          const page = parseInt(req.url.searchParams.get("page") || "1");

          return res.once(
            ctx.status(200),
            ctx.json(mockPaginationFromBackend(examplesMock, perPage, page))
          );
        }),

        rest.get("/api/examples", (req, res, ctx) => {
          return res.once(
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

      const anchorToSearch = screen.getByText("Search");
      fireEvent.click(anchorToSearch);

      /* Act. */
      const exampleInputElement: HTMLElement = screen.getByLabelText("EXAMPLE");

      fireEvent.change(exampleInputElement, {
        target: { value: "lause numero-1" },
      });

      const searchButton: HTMLElement = screen.getByText("SEARCH");
      fireEvent.click(searchButton);

      /* Assert. */
      let element: HTMLElement;
      element = await screen.findByText(
        "[FROM <Search>'s useEffect HOOK] PLEASE LOG BACK IN"
      );
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " suppose that a user, who is not logged in," +
      " (a) clicks on 'Log in' and (b) clicks on 'FORGOT PASSWORD?';" +
      " if the user submits the form without filling it out," +
      " an alert should be created",
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

      const anchorToLogIn: HTMLElement = screen.getByText("Log in");
      fireEvent.click(anchorToLogIn);

      const anchorToRequestPasswordReset: HTMLElement =
        screen.getByText("FORGOT PASSWORD?");
      fireEvent.click(anchorToRequestPasswordReset);

      /* Act. */
      const requestPasswordResetBtn: HTMLElement = screen.getByRole("button", {
        name: "REQUEST PASSWORD RESET",
      });
      fireEvent.click(requestPasswordResetBtn);

      /* Assert. */
      const element: HTMLElement = screen.getByText(
        "THE FORM FIELD MUST BE FILLED OUT"
      );
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " suppose that a user, who is not logged in," +
      " (a) clicks on 'Log in' and (b) clicks on 'FORGOT PASSWORD?';" +
      " if the user fills out the form and submits it," +
      " an alert should be created",
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

      const anchorToLogIn: HTMLElement = screen.getByText("Log in");
      fireEvent.click(anchorToLogIn);

      const anchorToRequestPasswordReset: HTMLElement =
        screen.getByText("FORGOT PASSWORD?");
      fireEvent.click(anchorToRequestPasswordReset);

      /* Act. */
      const emailInputElement: HTMLElement = screen.getByLabelText("EMAIL");
      fireEvent.change(emailInputElement, {
        target: { value: "test-jd@protonmail.com" },
      });

      const requestPasswordResetBtn: HTMLElement = screen.getByRole("button", {
        name: "REQUEST PASSWORD RESET",
      });
      fireEvent.click(requestPasswordResetBtn);

      /* Assert. */
      const element: HTMLElement = await screen.findByText(
        "PASSWORD-RESET INSTRUCTIONS WERE SUCCESSFULLY SENT TO test-jd@protonmail.com"
      );
      expect(element).toBeInTheDocument();
    }
  );

  test(
    "<App> -" +
      " if a logged-in user manually changes" +
      " the URL in her browser's address bar to /request_password_reset ," +
      " the frontend application should redirect the user to /home",
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

      let temp: HTMLElement;

      temp = await screen.findByText("Log out");
      expect(temp).toBeInTheDocument();

      expect(history.location.pathname).toEqual("/");

      /* Act. */
      /* Simulate the user's manually changing the URL in her browser's address bar. */
      /*
      Note to self:
      the commented-out parts below were copied from existing test cases
      but appear to be unnecessary
      */
      // cleanup();

      history.push("/request_password_reset");

      // render(
      //   <Provider store={realStore}>
      //     <Router history={history}>
      //       <App />
      //     </Router>
      //   </Provider>
      // );

      /* Assert. */
      expect(history.location.pathname).toEqual("/home");
    }
  );
});

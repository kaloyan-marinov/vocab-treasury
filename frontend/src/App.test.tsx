import "@testing-library/jest-dom";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  cleanup,
} from "@testing-library/react";
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import { createMemoryHistory, MemoryHistory } from "history";
import { Router } from "react-router-dom";
import { rest } from "msw";
import { setupServer, SetupServer } from "msw/node";
import thunkMiddleware from "redux-thunk";

import { IState } from "./types";
import { INITIAL_STATE, rootReducer, TEnhancer } from "./store";
import {
  createMockOneOrManyFailures,
  requestHandlers,
  RequestHandlingFacilitator,
} from "./testHelpers";
import { App } from "./App";

// const BIG_VALUE_FOR_TIMEOUT_OF_ASYNCHRONOUS_OPERATIONS: number = 5 * 60 * 1000;
// jest.setTimeout(BIG_VALUE_FOR_TIMEOUT_OF_ASYNCHRONOUS_OPERATIONS);

/* Create an MSW "request-interception layer". */
const mockMultipleFailures = createMockOneOrManyFailures("multiple failures", {
  statusCode: 401,
  error: "[mocked] Unauthorized",
  message: "[mocked] Authentication in the Basic Auth format is required.",
});
const requestHandlersToMock = [
  rest.post("/api/users", mockMultipleFailures),

  rest.post("/api/tokens", mockMultipleFailures),

  rest.get("/api/user-profile", mockMultipleFailures),

  rest.post("/api/request-password-reset", mockMultipleFailures),

  rest.get("/api/examples", mockMultipleFailures),
  rest.post("/api/examples", mockMultipleFailures),
  rest.put("/api/examples/:id", mockMultipleFailures),
  rest.delete("/api/examples/:id", mockMultipleFailures),
];

const requestInterceptionLayer: SetupServer = setupServer(
  ...requestHandlersToMock
);

let enhancer: TEnhancer;
let initState: IState;
let history: MemoryHistory<unknown>;

beforeAll(() => {
  /* Enable API mocking. */
  requestInterceptionLayer.listen();
});

beforeEach(() => {
  enhancer = applyMiddleware(thunkMiddleware);

  initState = {
    ...INITIAL_STATE,
  };

  history = createMemoryHistory();
});

afterEach(() => {
  requestInterceptionLayer.resetHandlers();
});

afterAll(() => {
  /* Disable API mocking. */
  requestInterceptionLayer.close();
});

test(
  "if a user logs in and goes on to hit her browser's Reload button," +
    " the frontend application should continue to display" +
    " a logged-in user's navigation links",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, initState, enhancer);

    const mockSingleFailure = createMockOneOrManyFailures("single failure", {
      statusCode: 401,
      error: "[mocked] Unauthorized",
      message: "[mocked] Authentication in the Basic Auth format is required.",
    });
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", mockSingleFailure),

      rest.post("/api/tokens", requestHandlers.mockIssueJWSToken),
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile)
    );

    render(
      <Provider store={realStore}>
        <Router history={history}>
          <App />
        </Router>
      </Provider>
    );

    /* Arrange. */
    let temp: HTMLElement;
    temp = await screen.findByText("TO CONTINUE, PLEASE LOG IN");
    expect(temp).toBeInTheDocument();

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

    temp = await screen.findByText("Log out");
    expect(temp).toBeInTheDocument();

    /* Act. */
    /*
    Simulate the user's hitting her browser's Reload button.
    
    (Note that the purpose of defining and using `realStoreAfterReload` as done below
    is purely illustrative,
    because the subsequent call to `render` dispatches a `fetchProfile()` thunk-action
    whose HTTP request will be intercepted and mocked/handled by `requestInterceptionLayer`.)
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
  "if the request issued by <App>'s useEffect hook fails," +
    " the user should be (logged out and) prompted to log in",
  async () => {
    /* Arrange. */
    requestInterceptionLayer.use(
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

    const realStore = createStore(rootReducer, enhancer);

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
  "<PrivateRoute> renders based on its 1st condition -" +
    " if the request issued by <App>'s useEffect hook succeeds," +
    " the user's clicking on the 'Account' navigation link" +
    " should navigate to the <PrivateRoute>, which wraps <Account>",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile)
    );

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
  "<PrivateRoute> renders based on its 2nd condition -" +
    " if a user hasn't logged in" +
    " but manually changes the URL in her browser's address bar" +
    " to /account ," +
    " the frontend application should redirect the user to /login",
  async () => {
    /* Arrange. */
    requestInterceptionLayer.use(
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

    const realStore = createStore(rootReducer, enhancer);

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
  "a newly-created user clicks the button for confirming their email address" +
    " and the request is processed succesfully by the backend",
  async () => {
    /* Arrange. */
    requestInterceptionLayer.use(
      rest.post(
        "/api/confirm-email-address/:token_for_confirming_email_address",
        (req, res, ctx) => {
          return res.once(
            ctx.status(200),
            ctx.json({
              message:
                "[mocked] You have confirmed your email address successfully." +
                " You may now log in.",
            })
          );
        }
      )
    );

    const realStore = createStore(rootReducer, enhancer);

    render(
      <Provider store={realStore}>
        <Router history={history}>
          <App />
        </Router>
      </Provider>
    );

    /* Act. */
    const tokenForConfirmingEmailAddress =
      "mocked-correct-token-for-confirming-email-address";
    history.push(`/confirm-email-address/${tokenForConfirmingEmailAddress}`);

    const confirmEmailAddressButton = screen.getByRole("button", {
      name: "Confirm my email address",
    });
    fireEvent.click(confirmEmailAddressButton);

    /* Assert. */
    const temp = await screen.findByText(
      "EMAIL-ADDRESS CONFIRMATION SUCCESSFUL - YOU MAY NOW LOG IN."
    );
    expect(temp).toBeInTheDocument();
  }
);

test(
  "a newly-created user clicks the button for confirming their email address" +
    " but the request is rejected by the backend",
  async () => {
    /* Arrange. */
    const mockSingleFailure = createMockOneOrManyFailures("single failure", {
      statusCode: 401,
      error: "[mocked] Unauthorized,",
      message: "[mocked] The provided token is invalid.",
    });
    requestInterceptionLayer.use(
      rest.post(
        "/api/confirm-email-address/:token_for_confirming_email_address",
        mockSingleFailure
      )
    );

    const realStore = createStore(rootReducer, enhancer);

    render(
      <Provider store={realStore}>
        <Router history={history}>
          <App />
        </Router>
      </Provider>
    );

    /* Act. */
    const tokenForConfirmingEmailAddress =
      "mocked-incorrect-token-for-confirming-email-address";
    history.push(`/confirm-email-address/${tokenForConfirmingEmailAddress}`);

    const confirmMyEmailAddressButton = screen.getByRole("button", {
      name: "Confirm my email address",
    });
    fireEvent.click(confirmMyEmailAddressButton);

    /* Assert. */
    const temp = await screen.findByText(
      "[mocked] The provided token is invalid." +
        " PLEASE DOUBLE-CHECK YOUR EMAIL INBOX FOR A MESSAGE" +
        " WITH INSTRUCTIONS ON HOW TO CONFIRM YOUR EMAIL ADDRESS."
    );
    expect(temp).toBeInTheDocument();
  }
);

test("the user clicks the navigation-controlling button for 'Next page'", async () => {
  /* Arrange. */
  const realStore = createStore(rootReducer, enhancer);

  const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
  requestInterceptionLayer.use(
    rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

    rest.get("/api/examples", rhf.createMockFetchExamples()),
    rest.get("/api/examples", rhf.createMockFetchExamples())
  );

  render(
    <Provider store={realStore}>
      <Router history={history}>
        <App />
      </Router>
    </Provider>
  );

  const anchorToOwnVocabTreasury = await screen.findByText("Own VocabTreasury");
  fireEvent.click(anchorToOwnVocabTreasury);

  /* Act. */
  const paginationCtrlBtnNext = await screen.findByRole("button", {
    name: "Next page",
  });
  fireEvent.click(paginationCtrlBtnNext);

  /* Assert. */
  /*    (a) [representations of] Example resources */
  let element: HTMLElement;
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

  for (const textFromExample8 of [
    "8",
    "sana numero-8",
    "lause numero-8",
    "käännös numero-8",
  ]) {
    element = screen.getByText(textFromExample8);
    expect(element).toBeInTheDocument();
  }

  /*    (b) elements for controlling pagination of Example resources */
  element = screen.getByText("Current page: 2");
  expect(element).toBeInTheDocument();
});

test("the user clicks the navigation-controlling button for 'Last page: N'", async () => {
  /* Arrange. */
  const realStore = createStore(rootReducer, enhancer);

  const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
  requestInterceptionLayer.use(
    rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

    rest.get("/api/examples", rhf.createMockFetchExamples()),
    rest.get("/api/examples", rhf.createMockFetchExamples())
  );

  render(
    <Provider store={realStore}>
      <Router history={history}>
        <App />
      </Router>
    </Provider>
  );

  const anchorToOwnVocabTreasury = await screen.findByText("Own VocabTreasury");
  fireEvent.click(anchorToOwnVocabTreasury);

  /* Act. */
  const paginationCtrlBtnNext = await screen.findByRole("button", {
    name: "Last page: 6",
  });
  fireEvent.click(paginationCtrlBtnNext);

  /* Assert. */
  /*    (a) [representations of] Example resources */
  let element: HTMLElement;
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

  /*    (b) elements for controlling pagination of Example resources */
  element = screen.getByText("Current page: 6");
  expect(element).toBeInTheDocument();
});

test(
  "the user clicks first the navigation-controlling button for 'Last page: N'" +
    " and then that for 'Previous page'",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.get("/api/examples", rhf.createMockFetchExamples())
    );

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
    element = await screen.findByText("2");
    expect(element).toBeInTheDocument();

    for (const textFromExample2 of [
      "sana numero-2",
      "lause numero-2",
      "käännös numero-2",
    ]) {
      element = screen.getByText(textFromExample2);
      expect(element).toBeInTheDocument();
    }

    for (const textFromExample3 of [
      "3",
      "sana numero-3",
      "lause numero-3",
      "käännös numero-3",
    ]) {
      element = screen.getByText(textFromExample3);
      expect(element).toBeInTheDocument();
    }

    /*    (b) elements for controlling pagination of Example resources */
    element = screen.getByText("Current page: 5");
    expect(element).toBeInTheDocument();
  }
);

test(
  "the user clicks first the navigation-controlling button for 'Next page'" +
    " and then that for 'First page: 1'",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.get("/api/examples", rhf.createMockFetchExamples())
    );

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
    element = screen.getByText("Current page: 1");
    expect(element).toBeInTheDocument();
  }
);

test(
  "the user fills out the form on /example/new and submits it," +
    " and the backend is _mocked_ to respond that" +
    " the form submission was accepted as valid and processed",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.post("/api/examples", rhf.createMockCreateExample()),
      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.get("/api/examples", rhf.createMockFetchExamples())
    );

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
    let element: HTMLElement;

    element = await screen.findByText("EXAMPLE CREATION SUCCESSFUL");
    expect(element).toBeInTheDocument();

    await waitFor(() => {
      expect(history.location.pathname).toEqual("/own-vocabtreasury");
    });

    element = await screen.findByText("test-word");
    expect(element).toBeInTheDocument();

    element = await screen.findByText("test-example");
    expect(element).toBeInTheDocument();
  }
);

test(
  "the user fills out the form on /example/new and submits it," +
    " but the backend is _mocked_ to respond that" +
    " the form submission was determined to be invalid",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),

      rest.post("/api/examples", (req, res, ctx) => {
        return res.once(
          ctx.status(400),
          ctx.json({
            error: "[mocked] Bad Request",
            message: "[mocked] Failed to create a new Example resource.",
          })
        );
      })
    );

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
  "the user fills out the form on /example/new and submits it," +
    " but the backend is _mocked_ to respond that" +
    " the user's access token has expired",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),

      rest.post("/api/examples", (req, res, ctx) => {
        return res.once(
          ctx.status(401),
          ctx.json({
            error: "[mocked] Unauthorized",
            message: "[mocked] Expired access token.",
          })
        );
      })
    );

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
    const sourceLanguageInputElement = screen.getByLabelText("SOURCE LANGUAGE");
    expect(sourceLanguageInputElement).toBeInTheDocument();
    const contentTranslationInputElement = screen.getByLabelText("TRANSLATION");
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
  "if a logged-in user (a) clicks on 'Own VocabTreasury'," +
    " (b) navigates to a page [of examples] different from page 1," +
    " and (c) clicks on one of that page's examples," +
    " then by clicking on 'Return to this example within my Own VocabTreasury'" +
    " the user should be navigated back to the same page [of examples]",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.get("/api/examples", rhf.createMockFetchExamples())
    );

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
      "9"
    );
    fireEvent.click(exampleOnPage2AnchorElement);

    const returnToOwnVocabTreasuryAnchorElement: HTMLElement = screen.getByText(
      "Return to this example within my Own VocabTreasury"
    );
    fireEvent.click(returnToOwnVocabTreasuryAnchorElement);

    /* Assert. */
    /*
      - wait for the same page [of examples] to be rendered
    */
    const currentPageSpanElement: HTMLElement = await screen.findByText(
      "Current page: 2"
    );
    expect(currentPageSpanElement).toBeInTheDocument();

    const newWord3TableCellElement: HTMLElement =
      screen.getByText("sana numero-9");
    expect(newWord3TableCellElement).toBeInTheDocument();

    const newWord4TableCellElement: HTMLElement =
      screen.getByText("sana numero-8");
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
  "if a logged-in user (a) clicks on 'Own VocabTreasury'," +
    " (b) navigates to the 1st page [of examples]," +
    " and (c) clicks on one of that page's examples," +
    " then by requesting to delete the selected example" +
    " the user should be navigated back to the same page [of examples]",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),

      rest.delete("/api/examples/:id", rhf.createMockDeleteExample()),
      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.get("/api/examples", rhf.createMockFetchExamples())
    );

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
    const anchorToExample11: HTMLElement = await screen.findByText("11");
    expect(anchorToExample11).toBeInTheDocument();
    fireEvent.click(anchorToExample11);

    let temp: HTMLElement;
    temp = screen.getByRole("button", {
      name: "Delete this example",
    });
    fireEvent.click(temp);
    temp = screen.getByRole("button", {
      name: "No, retain example",
    });
    fireEvent.click(temp);

    const buttonDeleteThisExample: HTMLElement = screen.getByRole("button", {
      name: "Delete this example",
    });
    fireEvent.click(buttonDeleteThisExample);

    const buttonYesDeleteExample: HTMLElement = screen.getByRole("button", {
      name: "Yes, delete example",
    });
    fireEvent.click(buttonYesDeleteExample);

    /* Assert. */
    let element: HTMLElement;
    /*
    It is worth emphasizing that:
    (a) when you run this test,
        it will PASS, but
    (b) when you use the Jest extension to debug this test,
        it will FAIL at the next statement.
    
    The reason for (b) is that,
    as per https://testing-library.com/docs/dom-testing-library/api-async ,
    "[the] default timeout [for `waitFor` and the other async utilities within `RTL`]
    is 1000ms."

    If you wish to use the Jest extension to debug this test
    without it FAILing due to the default timeout,
    please change the following statement to:
    ```
    element = await screen.findByText("Current page: 1", undefined, {
      timeout: BIG_VALUE_FOR_TIMEOUT_OF_ASYNCHRONOUS_OPERATIONS,
    });
    ```
    */
    element = await screen.findByText("Current page: 1");
    expect(element).toBeInTheDocument();

    element = screen.getByText("lause numero-10");
    expect(element).toBeInTheDocument();

    element = screen.getByText("lause numero-9");
    expect(element).toBeInTheDocument();
  }
);

test(
  "if a logged-in user (a) clicks on 'Own VocabTreasury'," +
    " (b) navigates to the last page [of examples]" +
    " and there is only 1 example on that page," +
    " and (c) clicks that single example," +
    " then by clicking on 'Delete this example'" +
    " the user should be navigated back to the last page [of examples]",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),

      rest.get("/api/examples", rhf.createMockFetchExamples()),

      rest.delete("/api/examples/:id", rhf.createMockDeleteExample()),
      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.get("/api/examples", rhf.createMockFetchExamples())
    );

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
    const anchorToExample1: HTMLElement = await screen.findByText("1");
    expect(anchorToExample1).toBeInTheDocument();
    fireEvent.click(anchorToExample1);

    const buttonDeleteThisExample: HTMLElement = await screen.findByRole(
      "button",
      {
        name: "Delete this example",
      }
    );
    fireEvent.click(buttonDeleteThisExample);

    const buttonYesDeleteExample: HTMLElement = screen.getByRole("button", {
      name: "Yes, delete example",
    });
    fireEvent.click(buttonYesDeleteExample);

    /* Assert. */
    let element: HTMLElement;
    /*
    It is worth emphasizing that:
    (a) when you run this test,
        it will PASS, but
    (b) when you use the Jest extension to debug this test,
        it will FAIL at the next statement.
    
    The reason for (b) is that,
    as per https://testing-library.com/docs/dom-testing-library/api-async ,
    "[the] default timeout [for `waitFor` and the other async utilities within `RTL`]
    is 1000ms."

    If you wish to use the Jest extension to debug this test
    without it FAILing due to the default timeout,
    please change the following statement to:
    ```
    element = await screen.findByText("Current page: 5", undefined, {
      timeout: BIG_VALUE_FOR_TIMEOUT_OF_ASYNCHRONOUS_OPERATIONS,
    });
    ```
    */
    element = await screen.findByText("Current page: 5");
    expect(element).toBeInTheDocument();

    element = screen.getByText("lause numero-3");
    expect(element).toBeInTheDocument();

    element = screen.getByText("lause numero-2");
    expect(element).toBeInTheDocument();
  }
);

test(
  "suppose that a logged-in user (a) clicks on 'Own VocabTreasury'" +
    " and (b) clicks on some example;" +
    " if the user's access token expires" +
    " and then the user clicks on 'Delete this example'," +
    " the user gets logged out",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
    const mockSingleFailure = createMockOneOrManyFailures("single failure", {
      statusCode: 401,
      error: "[mocked] Unauthorized",
      message: "[mocked] Authentication in the Basic Auth format is required.",
    });
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),

      rest.delete("/api/examples/:id", mockSingleFailure)
    );

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
    const anchorToExample11: HTMLElement = await screen.findByText("11");
    expect(anchorToExample11).toBeInTheDocument();
    fireEvent.click(anchorToExample11);

    const buttonDeleteThisExample: HTMLElement = await screen.findByRole(
      "button",
      {
        name: "Delete this example",
      }
    );
    fireEvent.click(buttonDeleteThisExample);

    const buttonYesDeleteExample: HTMLElement = screen.getByRole("button", {
      name: "Yes, delete example",
    });
    fireEvent.click(buttonYesDeleteExample);

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
  "if a logged-in user selects one of her examples and edits it successfully," +
    " the user should be re-directed to /own-vocabtreasury" +
    " (and, more specifically, to the page containing the selected example)" +
    " and the edited example should be displayed there",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();

    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),

      rest.put("/api/examples/:id", rhf.createMockEditExample()),
      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.get("/api/examples", rhf.createMockFetchExamples())
    );

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

    const anchorToExample11: HTMLElement = await screen.findByText("11");
    expect(anchorToExample11).toBeInTheDocument();
    fireEvent.click(anchorToExample11);

    const editThisExampleAnchor: HTMLElement = await screen.findByText(
      "Edit this example"
    );
    fireEvent.click(editThisExampleAnchor);

    /* Act. */
    const sourceLanguageInputElement: HTMLElement =
      await screen.findByLabelText("SOURCE LANGUAGE");
    const newWordInputElement: HTMLElement = screen.getByLabelText("NEW WORD");
    const exampleInputElement: HTMLElement = screen.getByLabelText("EXAMPLE");
    const translationInputElement: HTMLElement =
      screen.getByLabelText("TRANSLATION");

    fireEvent.change(sourceLanguageInputElement, {
      target: { value: "German" },
    });
    fireEvent.change(newWordInputElement, {
      target: { value: "Wort numero-11" },
    });
    fireEvent.change(exampleInputElement, {
      target: { value: "Satz numero-11" },
    });
    fireEvent.change(translationInputElement, {
      target: { value: "Übersetzung numero-11" },
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

    element = screen.getByText("Wort numero-11");
    expect(element).toBeInTheDocument();
    element = screen.getByText("Satz numero-11");
    expect(element).toBeInTheDocument();
    element = screen.getByText("Übersetzung numero-11");
    expect(element).toBeInTheDocument();

    element = screen.getByText("sana numero-10");
    expect(element).toBeInTheDocument();
    element = screen.getByText("lause numero-10");
    expect(element).toBeInTheDocument();
    element = screen.getByText("käännös numero-10");
    expect(element).toBeInTheDocument();
  }
);

test(
  "if a logged-in user selects one of her examples" +
    " and edits it in an invalid way," +
    " an alert about the error should be created",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();

    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples())
    );

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

    const anchorToExample11: HTMLElement = await screen.findByText("11");
    expect(anchorToExample11).toBeInTheDocument();
    fireEvent.click(anchorToExample11);

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
  "suppose that a logged-in user (a) selects one of her examples" +
    " and (b) clicks on the 'Edit this example' link;" +
    " if the user's access token expires" +
    " and then the user clicks on 'EDIT THIS EXAMPLE'," +
    " the user should get logged out",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
    const mockSingleFailure = createMockOneOrManyFailures("single failure", {
      statusCode: 401,
      error: "[mocked] Unauthorized",
      message: "[mocked] Authentication in the Basic Auth format is required.",
    });
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),

      rest.put("/api/examples/:id", mockSingleFailure)
    );

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

    const anchorToExample11: HTMLElement = await screen.findByText("11");
    expect(anchorToExample11).toBeInTheDocument();
    fireEvent.click(anchorToExample11);

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
  "if a logged-in user searches her Own VocabTreasury for matching examples," +
    " a table of matching examples should be rendered," +
    " together with pagination-controlling buttons that can be used",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.get("/api/examples", rhf.createMockFetchExamples()),
      rest.get("/api/examples", rhf.createMockFetchExamples())
    );

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
    const newWordInputElement: HTMLElement = screen.getByLabelText("NEW WORD");

    fireEvent.change(newWordInputElement, {
      target: { value: "sana numero-1" },
    });

    const searchButton: HTMLElement = screen.getByText("SEARCH");
    fireEvent.click(searchButton);

    /* Assert. */
    let element: HTMLElement;
    element = await screen.findByText("sana numero-11");
    expect(element).toBeInTheDocument();

    element = screen.getByText("sana numero-10");
    expect(element).toBeInTheDocument();

    element = screen.getByText("Current page: 1");
    expect(element).toBeInTheDocument();

    const lastPageButton: HTMLElement = screen.getByRole("button", {
      name: "Last page: 2",
    });
    expect(lastPageButton).toBeInTheDocument();

    /* Act. */
    fireEvent.click(lastPageButton);

    element = await screen.findByText("sana numero-1");
    expect(element).toBeInTheDocument();

    element = screen.getByText("Current page: 2");
    expect(element).toBeInTheDocument();
  }
);

test(
  "suppose that a logged-in user (a) clicks on Own VocabTreasury" +
    " and (b) clicks on the Search anchor tag;" +
    " if the user's access token expires" +
    " and then the user submits the 'search form' by clicking 'SEARCH'," +
    " the user gets logged out",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
    const mockSingleFailure = createMockOneOrManyFailures("single failure", {
      statusCode: 401,
      error: "[mocked] Unauthorized",
      message: "[mocked] Authentication in the Basic Auth format is required.",
    });
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile),

      rest.get("/api/examples", rhf.createMockFetchExamples()),

      rest.get("/api/examples", mockSingleFailure)
    );

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
      "[FROM <Search>'S useEffect HOOK] PLEASE LOG BACK IN"
    );
    expect(element).toBeInTheDocument();
  }
);

test(
  "suppose that a user, who is not logged in," +
    " (a) clicks on 'Log in' and (b) clicks on 'FORGOT PASSWORD?';" +
    " if the user submits the form without filling it out," +
    " an alert should be created",
  async () => {
    /* Arrange. */
    requestInterceptionLayer.use(
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

    const realStore = createStore(rootReducer, enhancer);

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
  "suppose that a user, who is not logged in," +
    " (a) clicks on 'Log in' and (b) clicks on 'FORGOT PASSWORD?';" +
    " if the user fills out the form and submits it," +
    " an alert should be created",
  async () => {
    /* Arrange. */
    const mockSingleFailure = createMockOneOrManyFailures("single failure", {
      statusCode: 401,
      error: "[mocked] Unauthorized",
      message: "[mocked] Authentication in the Basic Auth format is required.",
    });
    requestInterceptionLayer.use(
      rest.get("/api/user-profile", mockSingleFailure),
      rest.post(
        "/api/request-password-reset",
        requestHandlers.mockRequestPasswordReset
      )
    );

    const realStore = createStore(rootReducer, enhancer);

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
  "if a logged-in user manually changes" +
    " the URL in her browser's address bar to /request-password-reset ," +
    " the frontend application should redirect the user to /home",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile)
    );

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
    history.push("/request-password-reset");

    /* Assert. */
    expect(history.location.pathname).toEqual("/home");
  }
);

test(
  "if a logged-in user manually changes" +
    " the URL in her browser's address bar to" +
    " /confirm-email-address/let-us-pretend-this-part-is-a-valid-token ," +
    " the frontend application should redirect the user to /home",
  async () => {
    /* Arrange. */
    const realStore = createStore(rootReducer, enhancer);

    requestInterceptionLayer.use(
      rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile)
    );

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
    history.push(
      "/confirm-email-address/let-us-pretend-this-part-is-a-valid-token"
    );

    /* Assert. */
    expect(history.location.pathname).toEqual("/home");
  }
);

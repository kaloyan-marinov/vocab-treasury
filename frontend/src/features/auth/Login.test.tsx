import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { Provider } from "react-redux";
import { createMemoryHistory, MemoryHistory } from "history";
import { Router } from "react-router-dom";
import { DefaultBodyType, MockedRequest, rest, RestHandler } from "msw";
import { setupServer, SetupServer } from "msw/node";

import { rootReducer, TEnhancer } from "../../store";
import { Login } from "./Login";
import { Alerts } from "../alerts/Alerts";
import {
  createMockOneOrManyFailures,
  requestHandlers,
} from "../../testHelpers";

describe("<Login>", () => {
  test("renders a login form", () => {
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

/* Create an MSW "request-interception layer". */
const requestHandlersToMock: RestHandler<MockedRequest<DefaultBodyType>>[] = [];

const requestInterceptionLayer: SetupServer = setupServer(
  ...requestHandlersToMock
);

let enhancer: TEnhancer;
let history: MemoryHistory<unknown>;

beforeEach(() => {
  enhancer = applyMiddleware(thunkMiddleware);

  history = createMemoryHistory();
});

describe("multiple components + mocking of HTTP requests to the backend", () => {
  beforeAll(() => {
    /* Enable API mocking. */
    requestInterceptionLayer.listen();
  });

  afterEach(() => {
    requestInterceptionLayer.resetHandlers();
  });

  afterAll(() => {
    /* Disable API mocking. */
    requestInterceptionLayer.close();
  });

  test(
    "<Alerts> + <Login> -" +
      " the user fills out the form and submits it," +
      " and the backend is _mocked_ to respond that" +
      " the form submission was accepted as valid and processed",
    async () => {
      /* Arrange. */
      const realStore = createStore(rootReducer, enhancer);

      requestInterceptionLayer.use(
        rest.post("/api/tokens", requestHandlers.mockIssueJWSToken),
        rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile)
      );

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
      const realStore = createStore(rootReducer, enhancer);

      const mockSingleFailure = createMockOneOrManyFailures("single failure", {
        statusCode: 401,
        error: "[mocked] Unauthorized",
        message:
          "[mocked] Authentication in the Basic Auth format is required.",
      });
      requestInterceptionLayer.use(rest.post("/api/tokens", mockSingleFailure));

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
        "[mocked] Authentication in the Basic Auth format is required."
      );
      expect(element).toBeInTheDocument();
    }
  );
});

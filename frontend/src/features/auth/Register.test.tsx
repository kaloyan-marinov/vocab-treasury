import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { Provider } from "react-redux";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";

import { IState, INITIAL_STATE, rootReducer } from "../../store";
import { Register } from "./Register";
import { Alerts } from "../alerts/Alerts";

import { DefaultRequestBody, MockedRequest, rest, RestHandler } from "msw";
import { setupServer, SetupServerApi } from "msw/node";

import { requestHandlers } from "../../testHelpers";

describe("<Register>", () => {
  test("redirects any logged-in user to /home", () => {
    /* Arrange. */
    const initState: IState = {
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

/* Create an MSW "request-interception layer". */
const restHandlers: RestHandler<MockedRequest<DefaultRequestBody>>[] = [];

const quasiServer: SetupServerApi = setupServer(...restHandlers);

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
      quasiServer.use(rest.post("/api/users", requestHandlers.mockCreateUser));

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
});

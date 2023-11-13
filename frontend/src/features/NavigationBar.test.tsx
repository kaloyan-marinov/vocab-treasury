import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { applyMiddleware, createStore } from "redux";
import { Provider } from "react-redux";
import thunkMiddleware from "redux-thunk";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";

import { INITIAL_STATE, rootReducer } from "../store";
import { NavigationBar } from "./NavigationBar";
import { Alerts } from "./alerts/Alerts";

const linksForGuestUser = [
  "VocabTreasury: Home",
  "About",
  "Log in",
  "Register",
];
const linksForLoggedInUser = ["Own VocabTreasury", "Account", "Log out"];

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
  for (const navigationLinkText of linksForGuestUser) {
    const element = screen.getByText(navigationLinkText);
    expect(element).toBeInTheDocument();
  }

  for (const navigationLinkText of linksForLoggedInUser) {
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
  for (const navigationLinkText of linksForLoggedInUser) {
    const element = screen.getByText(navigationLinkText);
    expect(element).toBeInTheDocument();
  }

  for (const navigationLinkText of linksForGuestUser) {
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

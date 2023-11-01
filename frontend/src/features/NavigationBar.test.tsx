import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { createStore } from "redux";
import { Provider } from "react-redux";

import { createMemoryHistory, MemoryHistory } from "history";
import { Router } from "react-router-dom";

import { IState } from "../types";
import { INITIAL_STATE, rootReducer, TEnhancer } from "../store";
import { NavigationBar } from "./NavigationBar";
import { Alerts } from "./alerts/Alerts";

import { applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";

const alwaysVisibleLinks = ["VocabTreasury", "Home", "About"];
const guestUserLinks = ["Log in", "Register"];
const loggedInUserLinks = ["Own VocabTreasury", "Account", "Log out"];

let enhancer: TEnhancer;
let initState: IState;
let history: MemoryHistory<unknown>;

beforeEach(() => {
  enhancer = applyMiddleware(thunkMiddleware);

  initState = {
    ...INITIAL_STATE,
  };

  history = createMemoryHistory();
});

test("renders all of a guest user's navigation links", () => {
  /* Arrange. */
  const realStore = createStore(rootReducer);

  /* Act. */
  render(
    <Provider store={realStore}>
      <Router history={history}>
        <NavigationBar />
      </Router>
    </Provider>
  );

  /* Assert. */
  for (const navigationLinkText of alwaysVisibleLinks.concat(guestUserLinks)) {
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
  initState = {
    ...INITIAL_STATE,
    auth: {
      ...INITIAL_STATE.auth,
      hasValidToken: true,
    },
  };
  const realStore = createStore(rootReducer, initState);

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
    initState = {
      ...INITIAL_STATE,
      auth: {
        ...INITIAL_STATE.auth,
        hasValidToken: true,
      },
    };
    const realStore = createStore(rootReducer, initState, enhancer);

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

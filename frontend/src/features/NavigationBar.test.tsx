import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { applyMiddleware, createStore } from "redux";
import { Provider } from "react-redux";
import thunkMiddleware from "redux-thunk";
import { createMemoryHistory } from "history";
import { Router } from "react-router-dom";

import { IState } from "../types";
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
  let element: HTMLElement | null;

  for (const navigationLinkText of linksForGuestUser) {
    element = screen.getByText(navigationLinkText);
    expect(element).toBeInTheDocument();
  }

  for (const navigationLinkText of linksForLoggedInUser) {
    element = screen.queryByText(navigationLinkText);
    expect(element).not.toBeInTheDocument();
  }
});

test("renders all of a logged-in user's navigation links", () => {
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
        <NavigationBar />
      </Router>
    </Provider>
  );

  /* Assert. */
  let element: HTMLElement | null;

  for (const navigationLinkText of linksForLoggedInUser) {
    element = screen.getByText(navigationLinkText);
    expect(element).toBeInTheDocument();
    expect(element.classList).not.toContain("active");
  }

  for (const navigationLinkText of linksForGuestUser) {
    element = screen.queryByText(navigationLinkText);
    expect(element).not.toBeInTheDocument();
  }
});

test(
  "clicking on each one of a guest user's navigation links" +
    " should style it as active",
  () => {
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
    let element: HTMLElement;

    for (const textInNavLink of linksForGuestUser) {
      /*
      Click on one guest-user link
      and ensure that the clicked link has become active.
      */
      element = screen.getByText(textInNavLink);
      fireEvent.click(element);
      expect(element.classList).toContain("active");

      /* Ensure that all other guest-user links are not active. */
      for (const textInOtherNavLink of linksForGuestUser) {
        if (textInOtherNavLink !== textInNavLink) {
          element = screen.getByText(textInOtherNavLink);
          expect(element.classList).not.toContain("active");
        }
      }
    }
  }
);

test(
  "clicking on each one of a logged-in user's navigation links" +
    " should style it as active",
  () => {
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
          <NavigationBar />
        </Router>
      </Provider>
    );

    /* Assert. */
    let element: HTMLElement;

    for (const textInNavLink of linksForLoggedInUser) {
      if (textInNavLink === "Log out") {
        continue;
      }

      /*
      Click on one logged-in-user link
      and ensure that the clicked link has become active.
      */
      element = screen.getByText(textInNavLink);
      fireEvent.click(element);
      expect(element.classList).toContain("active");

      /* Ensure that all other logged-in-user links are not active. */
      for (const textInOtherNavLink of linksForLoggedInUser) {
        if (textInOtherNavLink !== textInNavLink) {
          element = screen.getByText(textInOtherNavLink);
          expect(element.classList).not.toContain("active");
        }
      }
    }
  }
);

test(
  "+ <Alerts> - renders an alert" +
    " after the user clicks on the 'Log out' link",
  async () => {
    /* Arrange. */
    const initState: IState = {
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

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { createStore } from "redux";
import { Provider } from "react-redux";
import { createMemoryHistory, MemoryHistory } from "history";
import { Router } from "react-router-dom";

import { rootReducer, TStore } from "../store";
import { NavigationBarLink } from "./NavigationBarLink";

let realStore: TStore;
let history: MemoryHistory<unknown>;

beforeEach(() => {
  realStore = createStore(rootReducer);
  history = createMemoryHistory();
});

test("renders a link that is _not_ active", () => {
  /* Arrange. */
  /* Act. */
  render(
    <Provider store={realStore}>
      <Router history={history}>
        <NavigationBarLink
          destination="/some-url"
          isActive={false}
          text={"Go to /some-url"}
        />
      </Router>
    </Provider>
  );

  /* Assert. */
  const element: HTMLElement = screen.getByText("Go to /some-url");
  expect(element).toBeInTheDocument();
  expect(element.classList).not.toContain("active");
});

test("renders a link that is active", () => {
  /* Arrange. */
  /* Act. */
  render(
    <Provider store={realStore}>
      <Router history={history}>
        <NavigationBarLink
          destination="/some-url"
          isActive={true}
          text={"Go to /some-url"}
        />
      </Router>
    </Provider>
  );

  /* Assert. */
  const element: HTMLElement = screen.getByText("Go to /some-url");
  expect(element).toBeInTheDocument();
  expect(element.classList).toContain("active");
});

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { createStore } from "redux";
import { Provider } from "react-redux";

import { INITIAL_STATE, rootReducer } from "../store";
import { Account } from "./Account";

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

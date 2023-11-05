import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { createStore } from "redux";
import { Provider } from "react-redux";

import { IState } from "../../types";
import { INITIAL_STATE, rootReducer } from "../../store";
import { Alerts } from "./Alerts";

test("renders the alerts, which are present in the Redux state", () => {
  /* Arrange. */
  const initState: IState = {
    ...INITIAL_STATE,
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
    ...INITIAL_STATE,
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

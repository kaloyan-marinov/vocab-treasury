import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";

import { createStore } from "redux";
import { Provider } from "react-redux";

import { rootReducer } from "../../store";

import { Alerts } from "../alerts/Alerts";
import { RecordNewExample } from "./RecordNewExample";

test("renders the fields of a form for creating a new Example resource", () => {
  /* Arrange. */
  const realStore = createStore(rootReducer);

  /* Act. */
  render(
    <Provider store={realStore}>
      <RecordNewExample />
    </Provider>
  );

  /* Assert. */
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

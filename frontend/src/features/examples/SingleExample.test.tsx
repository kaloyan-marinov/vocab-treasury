import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { Router, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { Provider } from "react-redux";

import {
  IExampleFromBackend,
  IExample,
  IPaginationMetaFromBackend,
  IPaginationMeta,
  IPaginationLinks,
  IState,
} from "../../types";
import {
  mockPaginationFromBackend,
  MOCK_EXAMPLES,
} from "../../mockPiecesOfData";
import { convertToPaginationInFrontend } from "../../helperFunctionsForTesting";
import { INITIAL_STATE, rootReducer } from "../../store";
import { SingleExample } from "./SingleExample";

test(
  "renders a specific Example resource" +
    " and HTML elements that enable user interaction",
  () => {
    /* Arrange. */
    const perPage: number = 2;
    const page: number = 1;

    const paginationFromBackend: {
      _meta: IPaginationMetaFromBackend;
      _links: IPaginationLinks;
      items: IExampleFromBackend[];
    } = mockPaginationFromBackend(MOCK_EXAMPLES, perPage, page);
    const {
      meta,
      links,
      ids,
      entities,
    }: {
      meta: IPaginationMeta;
      links: IPaginationLinks;
      ids: number[];
      entities: { [exampleId: string]: IExample };
    } = convertToPaginationInFrontend(paginationFromBackend);

    const initState: IState = {
      ...INITIAL_STATE,
      examples: {
        ...INITIAL_STATE.examples,
        meta,
        links,
        ids,
        entities,
      },
    };
    const enhancer = applyMiddleware(thunkMiddleware);
    const realStore = createStore(rootReducer, initState, enhancer);

    const history = createMemoryHistory();
    history.push("/example/10");

    /* Act. */
    render(
      <Provider store={realStore}>
        <Router history={history}>
          <Route exact path="/example/:id">
            <SingleExample />
          </Route>
        </Router>
      </Provider>
    );

    /* Assert. */
    const divElement = screen.getByText(
      "You have selected the following Example from your Own VocabTreasury:"
    );
    expect(divElement).toBeInTheDocument();

    /* First row. */
    const idTableCellElement1 = screen.getByText("ID");
    expect(idTableCellElement1).toBeInTheDocument();

    const sourceLanguageTableCellElement1 = screen.getByText("SOURCE LANGUAGE");
    expect(sourceLanguageTableCellElement1).toBeInTheDocument();

    const newWordTableCellElement1 = screen.getByText("NEW WORD");
    expect(newWordTableCellElement1).toBeInTheDocument();

    const exampleTableCellElement1 = screen.getByText("EXAMPLE");
    expect(exampleTableCellElement1).toBeInTheDocument();

    const translationTableCellElement1 = screen.getByText("TRANSLATION");
    expect(translationTableCellElement1).toBeInTheDocument();

    /* Second row. */
    const idTableCellElement10 = screen.getByText("10");
    expect(idTableCellElement10).toBeInTheDocument();

    const sourceLanguageTableCellElement10 = screen.getByText("Finnish");
    expect(sourceLanguageTableCellElement10).toBeInTheDocument();

    const newWordTableCellElement10 = screen.getByText("sana numero-10");
    expect(newWordTableCellElement10).toBeInTheDocument();

    const exampleTableCellElement10 = screen.getByText("lause numero-10");
    expect(exampleTableCellElement10).toBeInTheDocument();

    const translationTableCellElement10 = screen.getByText("käännös numero-10");
    expect(translationTableCellElement10).toBeInTheDocument();

    // HTML elements that enable user interaction.
    const anchorForReturning = screen.getByText(
      "Return to this example within my Own VocabTreasury"
    );
    expect(anchorForReturning).toBeInTheDocument();

    const anchorForEditing = screen.getByText("Edit this example");
    expect(anchorForEditing).toBeInTheDocument();

    const buttonForDeleting = screen.getByRole("button", {
      name: "Delete this example",
    });
    expect(buttonForDeleting).toBeInTheDocument();
  }
);

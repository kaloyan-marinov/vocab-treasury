import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

import { Router, Route } from "react-router-dom";

import { createMemoryHistory, MemoryHistory } from "history";
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
import { INITIAL_STATE, rootReducer, TEnhancer } from "../../store";

import {
  mockPaginationFromBackend,
  MOCK_EXAMPLES,
} from "../../mockPiecesOfData";
import { convertToPaginationInFrontend } from "../../helperFunctionsForTesting";

import { SingleExample } from "./SingleExample";

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

    initState = {
      ...INITIAL_STATE,
      examples: {
        ...INITIAL_STATE.examples,
        meta,
        links,
        ids,
        entities,
      },
    };
    const realStore = createStore(rootReducer, initState, enhancer);

    history.push("/example/2");

    /* Arrange. */
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
    const idTableCellElement2 = screen.getByText("2");
    expect(idTableCellElement2).toBeInTheDocument();

    const sourceLanguageTableCellElement2 = screen.getByText("Finnish");
    expect(sourceLanguageTableCellElement2).toBeInTheDocument();

    const newWordTableCellElement2 = screen.getByText("sana numero-2");
    expect(newWordTableCellElement2).toBeInTheDocument();

    const exampleTableCellElement2 = screen.getByText("lause numero-2");
    expect(exampleTableCellElement2).toBeInTheDocument();

    const translationTableCellElement2 = screen.getByText("käännös numero-2");
    expect(translationTableCellElement2).toBeInTheDocument();

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

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { createMemoryHistory, MemoryHistory } from "history";
import { Router } from "react-router-dom";
import { createStore } from "redux";
import { Provider } from "react-redux";
import { applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import { DefaultRequestBody, MockedRequest, rest, RestHandler } from "msw";
import { setupServer, SetupServerApi } from "msw/node";

import { IState } from "../../types";
import { INITIAL_STATE, rootReducer, TEnhancer } from "../../store";
import {
  createMockOneOrManyFailures,
  RequestHandlingFacilitator,
} from "../../testHelpers";
import { Alerts } from "../alerts/Alerts";
import { OwnVocabTreasury } from "./OwnVocabTreasury";

/* Create an MSW "request-interception layer". */
const requestHandlersToMock: RestHandler<MockedRequest<DefaultRequestBody>>[] =
  [rest.get("/api/examples", createMockOneOrManyFailures("multiple failures"))];

const requestInterceptionLayer: SetupServerApi = setupServer(
  ...requestHandlersToMock
);

let enhancer: TEnhancer;
let initState: IState;
let history: MemoryHistory<unknown>;

describe("<OwnVocabTreasury> + mocking of HTTP requests to the backend", () => {
  beforeAll(() => {
    /* Enable API mocking. */
    requestInterceptionLayer.listen();
  });

  beforeEach(() => {
    enhancer = applyMiddleware(thunkMiddleware);

    initState = {
      ...INITIAL_STATE,
    };

    history = createMemoryHistory();
  });

  afterEach(() => {
    requestInterceptionLayer.resetHandlers();
  });

  afterAll(() => {
    /* Disable API mocking. */
    requestInterceptionLayer.close();
  });

  test(
    "renders a heading, manipulation links," +
      " and a page of the logged-in user's Example resources",
    async () => {
      /* Arrange. */
      initState = {
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
      const realStore = createStore(rootReducer, initState, enhancer);

      const rhf: RequestHandlingFacilitator = new RequestHandlingFacilitator();
      requestInterceptionLayer.use(
        rest.get("/api/examples", rhf.createMockFetchExamples())
      );

      /* Act. */
      render(
        <Provider store={realStore}>
          <Router history={history}>
            <OwnVocabTreasury />
          </Router>
        </Provider>
      );

      /* Assert. */
      /* - after the component's rendering: */
      /*    (a) items that appear above the table of Example resources */
      let element: HTMLElement;
      for (const expectedText of [
        "auth-jd's Own VocabTreasury",
        "Record new example",
        "Search",
      ]) {
        element = screen.getByText(expectedText);
        expect(element).toBeInTheDocument();
      }

      /*    (b) elements for controlling pagination of Example resources */
      console.log(`${new Date().toISOString()} - 1st run of screen.debug()`);
      screen.debug();

      element = screen.getByText("Building pagination-controlling buttons...");
      expect(element).toBeInTheDocument();

      /*    (c) table headers */
      for (const columnName of [
        "ID",
        "SOURCE LANGUAGE",
        "NEW WORD",
        "EXAMPLE",
        "TRANSLATION",
      ]) {
        const tableCellElement = screen.getByText(columnName);
        expect(tableCellElement).toBeInTheDocument();
      }

      /* - after the component's re-rendering: */
      /*    (a) [representations of] Example resources */
      element = await screen.findByText("1");

      console.log(`${new Date().toISOString()} - 2nd run of screen.debug()`);
      screen.debug();

      expect(element).toBeInTheDocument();

      for (const textFromExample1 of [
        "sana numero-1",
        "lause numero-1",
        "käännös numero-1",
      ]) {
        element = screen.getByText(textFromExample1);
        expect(element).toBeInTheDocument();
      }

      for (const textFromExample2 of [
        "2",
        "sana numero-2",
        "lause numero-2",
        "käännös numero-2",
      ]) {
        element = screen.getByText(textFromExample2);
        expect(element).toBeInTheDocument();
      }

      /*    (b) elements for controlling pagination of Example resources */
      for (const textOnPaginationControllingButton of [
        "First page: 1",
        "Previous page",
        "Next page",
        "Last page: 6",
      ]) {
        console.log("looking for ", textOnPaginationControllingButton);
        element = screen.getByRole("button", {
          name: textOnPaginationControllingButton,
        });
        expect(element).toBeInTheDocument();
      }

      element = screen.getByText("Current page: 1");
      expect(element).toBeInTheDocument();
    }
  );

  test(
    " + <Alerts>" +
      " a GET request to /api/examples is issued as part of the effect function," +
      " but the backend is _mocked_" +
      " to reject the client-provided authentication credential as invalid",
    async () => {
      /*
      TODO: find out whether it would be better practice to convert this test case
            into one that (fits under the
            "multiple components + mocking of HTTP requests to the backend" `describe`
            block and) renders the whole <App>, makes analogous assertions as this test,
            and finally concludes by making the following extra assertion:
              ```
              expect(history.location.pathname).toEqual("/login")
              ```
      */

      /* Arrange. */
      initState = {
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
      const realStore = createStore(rootReducer, initState, enhancer);

      /* Act. */
      render(
        <Provider store={realStore}>
          <Router history={history}>
            <Alerts />
            <OwnVocabTreasury />
          </Router>
        </Provider>
      );

      /* Assert. */
      const element: HTMLElement = await screen.findByText(
        "[FROM <OwnVocabTreasury>'S useEffect HOOK] PLEASE LOG BACK IN"
      );
      expect(element).toBeInTheDocument();
    }
  );
});

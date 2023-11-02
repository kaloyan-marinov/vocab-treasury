import { IState } from "../../types";

import {
  RequestStatus,
  IPaginationMetaFromBackend,
  IPaginationLinks,
  IPaginationMeta,
  IExampleFromBackend,
  IExample,
  IStateExamples,
} from "../../types";
import { INITIAL_STATE_EXAMPLES } from "../../constants";

/*
TODO: (2023/10/30, 07:35)

      before submitting a pull request for review,
      consider breaking down the symbols imported by the next statement
      into semantically-cohesive groups
*/
import {
  fetchExamplesPending,
  fetchExamplesRejected,
  fetchExamplesFulfilled,
  createExamplePending,
  createExampleRejected,
  createExampleFulfilled,
  deleteExamplePending,
  deleteExampleRejected,
  deleteExampleFulfilled,
  editExamplePending,
  editExampleRejected,
  editExampleFulfilled,
  examplesClearSlice,
  ActionTypesFetchExamples,
  IActionFetchExamplesPending,
  IActionFetchExamplesRejected,
  IActionFetchExamplesFulfilled,
  ActionTypesCreateExample,
  IActionCreateExamplePending,
  IActionCreateExampleRejected,
  IActionCreateExampleFulfilled,
  ActionTypesDeleteExample,
  IActionDeleteExamplePending,
  IActionDeleteExampleRejected,
  IActionDeleteExampleFulfilled,
  ActionTypesEditExample,
  IActionEditExamplePending,
  IActionEditExampleRejected,
  IActionEditExampleFulfilled,
  ACTION_TYPE_EXAMPLES_CLEAR_SLICE,
  IActionExamplesClearSlice,
  examplesReducer,
} from "./examplesSlice";

import { setupServer, SetupServerApi } from "msw/node";
import { MockStoreEnhanced } from "redux-mock-store";
import configureMockStore from "redux-mock-store";
import thunkMiddleware, { ThunkDispatch } from "redux-thunk";
import { DefaultRequestBody, MockedRequest, rest, RestHandler } from "msw";
import { AnyAction } from "redux";
import { requestHandlers, RequestHandlingFacilitator } from "../../testHelpers";
import { convertToPaginationInFrontend } from "../../helperFunctionsForTesting";
import {
  mockPaginationFromBackend,
  MOCK_EXAMPLES,
  MOCK_EXAMPLE,
  MOCK_EXAMPLE_AT_IDX_7,
} from "../../mockPiecesOfData";
import { INITIAL_STATE } from "../../store";
import {
  fetchExamples,
  createExample,
  deleteExample,
  editExample,
} from "./examplesSlice";

describe("action creators", () => {
  test("fetchExamplesPending", () => {
    const action = fetchExamplesPending();

    expect(action).toEqual({
      type: "examples/fetchExamples/pending",
    });
  });

  test("fetchExamplesRejected", () => {
    const action = fetchExamplesRejected("examples-fetchExamples-rejected");

    expect(action).toEqual({
      type: "examples/fetchExamples/rejected",
      error: "examples-fetchExamples-rejected",
    });
  });

  test("mockPaginationFromBackend (which is a function that helps test fetchExamplesFulfilled)", () => {
    const perPage: number = 2;
    const page: number = 1;

    const backendPaginationMock = mockPaginationFromBackend(
      MOCK_EXAMPLES,
      perPage,
      page
    );

    /*
        The two blocks of code below are equivalent,
        but the latter one is more idiomatic.
        */
    // const metaFromBackend: IPaginationMetaFromBackend = backendPaginationMock._meta;
    // const links: IPaginationLinks = backendPaginationMock._links;
    // const examplesFromBackend: IExampleFromBackend[] = backendPaginationMock.items;
    const {
      _meta: metaFromBackend,
      _links: links,
      items: examplesFromBackend,
    }: {
      _meta: IPaginationMetaFromBackend;
      _links: IPaginationLinks;
      items: IExampleFromBackend[];
    } = backendPaginationMock;

    expect(metaFromBackend).toEqual({
      total_items: 11,
      per_page: 2,
      total_pages: 6,
      page: 1,
    });
    expect(links).toEqual({
      self: "/api/examples?per_page=2&page=1",
      next: "/api/examples?per_page=2&page=2",
      prev: null,
      first: "/api/examples?per_page=2&page=1",
      last: "/api/examples?per_page=2&page=6",
    });
    expect(examplesFromBackend).toEqual([
      {
        id: 1,
        source_language: "Finnish",
        new_word: "sana numero-1",
        content: "lause numero-1",
        content_translation: "käännös numero-1",
      },
      {
        id: 2,
        source_language: "Finnish",
        new_word: "sana numero-2",
        content: "lause numero-2",
        content_translation: "käännös numero-2",
      },
    ]);
  });

  test("fetchExamplesFulfilled", () => {
    /* Arrange. */
    const perPage: number = 2;
    const page: number = 1;

    const backendPaginationMock = mockPaginationFromBackend(
      MOCK_EXAMPLES,
      perPage,
      page
    );

    /*
        The two blocks of code below are equivalent,
        but the latter one is more idiomatic.
        */
    // const metaFromBackend: IPaginationMetaFromBackend = backendPaginationMock._meta;
    // const links: IPaginationLinks = backendPaginationMock._links;
    // const examplesFromBackend: IExampleFromBackend[] = backendPaginationMock.items;
    const {
      _meta: metaFromBackend,
      _links: links,
      items: examplesFromBackend,
    }: {
      _meta: IPaginationMetaFromBackend;
      _links: IPaginationLinks;
      items: IExampleFromBackend[];
    } = backendPaginationMock;

    /* Act. */
    const action = fetchExamplesFulfilled(
      metaFromBackend,
      links,
      examplesFromBackend
    );

    /* Assert. */
    expect(action).toEqual({
      type: "examples/fetchExamples/fulfilled",
      payload: {
        meta: {
          totalItems: 11,
          perPage: 2,
          totalPages: 6,
          page: 1,
        },
        links: {
          self: "/api/examples?per_page=2&page=1",
          next: "/api/examples?per_page=2&page=2",
          prev: null,
          first: "/api/examples?per_page=2&page=1",
          last: "/api/examples?per_page=2&page=6",
        },
        items: [
          {
            id: 1,
            sourceLanguage: "Finnish",
            newWord: "sana numero-1",
            content: "lause numero-1",
            contentTranslation: "käännös numero-1",
          },
          {
            id: 2,
            sourceLanguage: "Finnish",
            newWord: "sana numero-2",
            content: "lause numero-2",
            contentTranslation: "käännös numero-2",
          },
        ],
      },
    });
  });

  test("examplesClearSlice", () => {
    const action = examplesClearSlice();

    expect(action).toEqual({
      type: "examples/clearSlice",
    });
  });

  test("createExamplePending", () => {
    const action = createExamplePending();

    expect(action).toEqual({
      type: "examples/createExample/pending",
    });
  });

  test("createExampleRejected", () => {
    const action = createExampleRejected("examples-createExample-rejected");

    expect(action).toEqual({
      type: "examples/createExample/rejected",
      error: "examples-createExample-rejected",
    });
  });

  test("createExampleFulfilled", () => {
    const action = createExampleFulfilled(
      17,
      "Finnish",
      "epätavallinen",
      "Pohjois-Amerikassa on epätavallisen kuuma sää.",
      "There is unusually hot weather in North America."
    );

    expect(action).toEqual({
      type: "examples/createExample/fulfilled",
      payload: {
        id: 17,
        sourceLanguage: "Finnish",
        newWord: "epätavallinen",
        content: "Pohjois-Amerikassa on epätavallisen kuuma sää.",
        contentTranslation: "There is unusually hot weather in North America.",
      },
    });
  });

  test("deleteExamplePending", () => {
    const action = deleteExamplePending();

    expect(action).toEqual({
      type: "examples/deleteExample/pending",
    });
  });

  test("deleteExampleRejected", () => {
    const action = deleteExampleRejected("examples-deleteExample-rejected");

    expect(action).toEqual({
      type: "examples/deleteExample/rejected",
      error: "examples-deleteExample-rejected",
    });
  });

  test("deleteExampleFulfilled", () => {
    const action = deleteExampleFulfilled(17);

    expect(action).toEqual({
      type: "examples/deleteExample/fulfilled",
      payload: {
        id: 17,
      },
    });
  });

  test("editExamplePending", () => {
    const action = editExamplePending();

    expect(action).toEqual({
      type: "examples/editExample/pending",
    });
  });

  test("editExampleRejected", () => {
    const action = editExampleRejected("examples-editExample-rejected");

    expect(action).toEqual({
      type: "examples/editExample/rejected",
      error: "examples-editExample-rejected",
    });
  });

  test("editExampleFulfilled", () => {
    const action = editExampleFulfilled(
      17,
      "Finnish",
      "varjo",
      "Suomen ideaalisää on 24 astetta varjossa.",
      "Finland's ideal weather is 24 degrees in the shade."
    );

    expect(action).toEqual({
      type: "examples/editExample/fulfilled",
      payload: {
        id: 17,
        sourceLanguage: "Finnish",
        newWord: "varjo",
        content: "Suomen ideaalisää on 24 astetta varjossa.",
        contentTranslation:
          "Finland's ideal weather is 24 degrees in the shade.",
      },
    });
  });
});

describe("reducer", () => {
  let initStExamples: IStateExamples;

  beforeEach(() => {
    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
    };
  });

  test("examples/fetchExamples/pending", () => {
    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.FAILED,
      requestError: "error-fetchExamples-rejected",
    };
    const action: IActionFetchExamplesPending = {
      type: ActionTypesFetchExamples.PENDING,
    };

    const newState: IStateExamples = examplesReducer(initStExamples, action);

    expect(newState).toEqual({
      requestStatus: RequestStatus.LOADING,
      requestError: null,
      meta: {
        totalItems: null,
        perPage: null,
        totalPages: null,
        page: null,
      },
      links: {
        self: null,
        next: null,
        prev: null,
        first: null,
        last: null,
      },
      ids: [],
      entities: {},
    });
  });

  test("examples/fetchExamples/rejected", () => {
    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.LOADING,
    };
    const action: IActionFetchExamplesRejected = {
      type: ActionTypesFetchExamples.REJECTED,
      error: "examples-fetchExamples-rejected",
    };

    const newState: IStateExamples = examplesReducer(initStExamples, action);

    expect(newState).toEqual({
      requestStatus: RequestStatus.FAILED,
      requestError: "examples-fetchExamples-rejected",
      meta: {
        totalItems: null,
        perPage: null,
        totalPages: null,
        page: null,
      },
      links: {
        self: null,
        next: null,
        prev: null,
        first: null,
        last: null,
      },
      ids: [],
      entities: {},
    });
  });

  test("examples/fetchExamples/fulfilled", () => {
    /* Arrange. */
    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.LOADING,
    };

    const perPage: number = 2;
    const page: number = 1;
    const {
      _meta,
      _links,
      items,
    }: {
      _meta: IPaginationMetaFromBackend;
      _links: IPaginationLinks;
      items: IExampleFromBackend[];
    } = mockPaginationFromBackend(MOCK_EXAMPLES, perPage, page);

    const action: IActionFetchExamplesFulfilled = {
      type: ActionTypesFetchExamples.FULFILLED,
      payload: {
        meta: {
          totalItems: _meta.total_items,
          perPage: _meta.per_page,
          totalPages: _meta.total_pages,
          page: _meta.page,
        },
        links: {
          self: _links.self,
          next: _links.next,
          prev: _links.prev,
          first: _links.first,
          last: _links.last,
        },
        items: items.map((e: IExampleFromBackend) => ({
          id: e.id,
          sourceLanguage: e.source_language,
          newWord: e.new_word,
          content: e.content,
          contentTranslation: e.content_translation,
        })),
      },
    };

    /* Act. */
    const newState: IStateExamples = examplesReducer(initStExamples, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.SUCCEEDED,
      requestError: null,
      meta: {
        totalItems: 11,
        perPage: 2,
        totalPages: 6,
        page: 1,
      },
      links: {
        self: "/api/examples?per_page=2&page=1",
        next: "/api/examples?per_page=2&page=2",
        prev: null,
        first: "/api/examples?per_page=2&page=1",
        last: "/api/examples?per_page=2&page=6",
      },
      ids: [1, 2],
      entities: {
        "1": {
          id: 1,
          sourceLanguage: "Finnish",
          newWord: "sana numero-1",
          content: "lause numero-1",
          contentTranslation: "käännös numero-1",
        },
        "2": {
          id: 2,
          sourceLanguage: "Finnish",
          newWord: "sana numero-2",
          content: "lause numero-2",
          contentTranslation: "käännös numero-2",
        },
      },
    });
  });

  test("examples/clearSlice", () => {
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

    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.SUCCEEDED,
      meta,
      links,
      ids,
      entities,
    };

    const action: IActionExamplesClearSlice = {
      type: ACTION_TYPE_EXAMPLES_CLEAR_SLICE,
    };

    /* Act. */
    const newState: IStateExamples = examplesReducer(initStExamples, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.SUCCEEDED,
      requestError: null,
      meta: {
        totalItems: null,
        perPage: null,
        totalPages: null,
        page: null,
      },
      links: {
        self: null,
        next: null,
        prev: null,
        first: null,
        last: null,
      },
      ids: [],
      entities: {},
    });
  });

  test("examples/createExample/pending", () => {
    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.FAILED,
      requestError: "examples-createExample-rejected",
    };
    const action: IActionCreateExamplePending = {
      type: ActionTypesCreateExample.PENDING,
    };

    const newState: IStateExamples = examplesReducer(initStExamples, action);

    expect(newState).toEqual({
      requestStatus: RequestStatus.LOADING,
      requestError: null,
      meta: {
        totalItems: null,
        perPage: null,
        totalPages: null,
        page: null,
      },
      links: {
        self: null,
        next: null,
        prev: null,
        first: null,
        last: null,
      },
      ids: [],
      entities: {},
    });
  });

  test("examples/createExample/rejected", () => {
    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
    };
    const action: IActionCreateExampleRejected = {
      type: ActionTypesCreateExample.REJECTED,
      error: "examples-createExample-rejected",
    };

    const newState: IStateExamples = examplesReducer(initStExamples, action);

    expect(newState).toEqual({
      requestStatus: RequestStatus.FAILED,
      requestError: "examples-createExample-rejected",
      meta: {
        totalItems: null,
        perPage: null,
        totalPages: null,
        page: null,
      },
      links: {
        self: null,
        next: null,
        prev: null,
        first: null,
        last: null,
      },
      ids: [],
      entities: {},
    });
  });

  test("examples/createExample/fulfilled", () => {
    /* Arrange. */
    const perPage: number = 2;
    const page: number = 2;
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

    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
      meta,
      links,
      ids,
      entities,
    };
    const action: IActionCreateExampleFulfilled = {
      type: ActionTypesCreateExample.FULFILLED,
      payload: {
        id: 17,
        sourceLanguage: "Finnish",
        newWord: "epätavallinen",
        content: "Pohjois-Amerikassa on epätavallisen kuuma sää.",
        contentTranslation: "There is unusually hot weather in North America.",
      },
    };

    /* Act. */
    const newState: IStateExamples = examplesReducer(initStExamples, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.SUCCEEDED,
      requestError: null,
      meta: {
        totalItems: 12,
        perPage: null,
        totalPages: null,
        page: null,
      },
      links: {
        self: null,
        next: null,
        prev: null,
        first: null,
        last: null,
      },
      ids: [17],
      entities: {
        "17": {
          id: 17,
          sourceLanguage: "Finnish",
          newWord: "epätavallinen",
          content: "Pohjois-Amerikassa on epätavallisen kuuma sää.",
          contentTranslation:
            "There is unusually hot weather in North America.",
        },
      },
    });
  });

  test("examples/deleteExample/pending", () => {
    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.FAILED,
      requestError: "examples-deleteExample-rejected",
    };
    const action: IActionDeleteExamplePending = {
      type: ActionTypesDeleteExample.PENDING,
    };

    const newState: IStateExamples = examplesReducer(initStExamples, action);

    expect(newState).toEqual({
      requestStatus: "loading",
      requestError: null,
      meta: {
        totalItems: null,
        perPage: null,
        totalPages: null,
        page: null,
      },
      links: {
        self: null,
        next: null,
        prev: null,
        first: null,
        last: null,
      },
      ids: [],
      entities: {},
    });
  });

  test("examples/deleteExample/rejected", () => {
    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
    };
    const action: IActionDeleteExampleRejected = {
      type: ActionTypesDeleteExample.REJECTED,
      error: "examples-deleteExample-rejected",
    };

    const newState: IStateExamples = examplesReducer(initStExamples, action);

    expect(newState).toEqual({
      requestStatus: "failed",
      requestError: "examples-deleteExample-rejected",
      meta: {
        totalItems: null,
        perPage: null,
        totalPages: null,
        page: null,
      },
      links: {
        self: null,
        next: null,
        prev: null,
        first: null,
        last: null,
      },
      ids: [],
      entities: {},
    });
  });

  test("examples/deleteExample/fulfilled", () => {
    /* Arrange. */
    const perPage: number = 2;
    const page: number = 2;
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

    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
      meta,
      links,
      ids,
      entities,
    };
    const action: IActionDeleteExampleFulfilled = {
      type: ActionTypesDeleteExample.FULFILLED,
      payload: {
        id: 4,
      },
    };

    /* Act. */
    const newState: IStateExamples = examplesReducer(initStExamples, action);

    /* Assert. */
    expect({
      requestStatus: newState.requestStatus,
      requestError: newState.requestError,
      ids: newState.ids,
      entities: newState.entities,
    }).toEqual({
      requestStatus: RequestStatus.SUCCEEDED,
      requestError: null,
      ids: [3],
      entities: {
        "3": {
          id: 3,
          sourceLanguage: "Finnish",
          newWord: "sana numero-3",
          content: "lause numero-3",
          contentTranslation: "käännös numero-3",
        },
      },
    });
  });

  test("examples/editExample/pending", () => {
    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.FAILED,
      requestError: "examples-editExample-rejected",
    };
    const action: IActionEditExamplePending = {
      type: ActionTypesEditExample.PENDING,
    };

    const newState: IStateExamples = examplesReducer(initStExamples, action);

    expect(newState).toEqual({
      requestStatus: "loading",
      requestError: null,
      meta: {
        totalItems: null,
        perPage: null,
        totalPages: null,
        page: null,
      },
      links: {
        self: null,
        next: null,
        prev: null,
        first: null,
        last: null,
      },
      ids: [],
      entities: {},
    });
  });

  test("examples/editExample/rejected", () => {
    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
    };
    const action: IActionEditExampleRejected = {
      type: ActionTypesEditExample.REJECTED,
      error: "examples-editExample-rejected",
    };

    const newState: IStateExamples = examplesReducer(initStExamples, action);

    expect(newState).toEqual({
      requestStatus: "failed",
      requestError: "examples-editExample-rejected",
      meta: {
        totalItems: null,
        perPage: null,
        totalPages: null,
        page: null,
      },
      links: {
        self: null,
        next: null,
        prev: null,
        first: null,
        last: null,
      },
      ids: [],
      entities: {},
    });
  });

  test("examples/editExample/fulfilled", () => {
    /* Arrange. */
    const perPage: number = 2;
    const page: number = 2;
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

    initStExamples = {
      ...INITIAL_STATE_EXAMPLES,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
      meta,
      links,
      ids,
      entities,
    };
    const action: IActionEditExampleFulfilled = {
      type: ActionTypesEditExample.FULFILLED,
      payload: {
        id: 3,
        sourceLanguage: "German",
        newWord: "Wort numero-4",
        content: "Satz numero-4",
        contentTranslation: "Übersetzung numero-4",
      },
    };

    /* Act. */
    const newState: IStateExamples = examplesReducer(initStExamples, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.SUCCEEDED,
      requestError: null,
      meta,
      links,
      ids: [3, 4],
      entities: {
        "3": {
          id: 3,
          sourceLanguage: "German",
          newWord: "Wort numero-4",
          content: "Satz numero-4",
          contentTranslation: "Übersetzung numero-4",
        },
        "4": {
          id: 4,
          sourceLanguage: "Finnish",
          newWord: "sana numero-4",
          content: "lause numero-4",
          contentTranslation: "käännös numero-4",
        },
      },
    });
  });
});

/* Create an MSW "request-interception layer". */
const requestHandlersToMock: RestHandler<MockedRequest<DefaultRequestBody>>[] =
  [];

const requestInterceptionLayer: SetupServerApi = setupServer(
  ...requestHandlersToMock
);

const createStoreMock = configureMockStore<
  IState,
  ThunkDispatch<IState, any, AnyAction>
>([thunkMiddleware]);
/*
MockStoreEnhanced<
    IState,
    ThunkDispatch<IState, any, AnyAction>
>
*/

describe(
  "dispatching of async thunk-actions," +
    " with each test case focusing on the action-related logic only" +
    " (and thus completely disregarding the reducer-related logic)",
  () => {
    let initState: IState;
    let storeMock: MockStoreEnhanced<
      IState,
      ThunkDispatch<IState, any, AnyAction>
    >;

    beforeAll(() => {
      /*
        Establish the created request-interception layer
        (= Enable API mocking).
        */
      requestInterceptionLayer.listen();
    });

    beforeEach(() => {
      initState = { ...INITIAL_STATE };
      storeMock = createStoreMock(initState);
    });

    afterEach(() => {
      /*
        Remove any request handlers that may have been added at runtime
        (by individual tests after the initial `setupServer` call).
        */
      requestInterceptionLayer.resetHandlers();
    });

    afterAll(() => {
      /*
        Prevent the established request-interception layer
        from affecting irrelevant tests
        by tearing down that layer
        (= Stop request interception)
        (= Disable API mocking).
        */
      requestInterceptionLayer.close();
    });

    test(
      "fetchExamples()" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        /* Arrange. */
        const rhf: RequestHandlingFacilitator =
          new RequestHandlingFacilitator();

        requestInterceptionLayer.use(
          rest.get("/api/examples", rhf.createMockFetchExamples())
        );

        /* Act. */
        const urlForOnePageOfExamples: string = "/api/examples";
        const fetchExamplesPromise = storeMock.dispatch(
          fetchExamples(urlForOnePageOfExamples)
        );

        /* Assert. */
        await expect(fetchExamplesPromise).resolves.toEqual(undefined);
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/fetchExamples/pending",
          },
          {
            type: "examples/fetchExamples/fulfilled",
            payload: {
              meta: {
                totalItems: 11,
                perPage: 2,
                totalPages: 6,
                page: 1,
              },
              links: {
                self: "/api/examples?per_page=2&page=1",
                next: "/api/examples?per_page=2&page=2",
                prev: null,
                first: "/api/examples?per_page=2&page=1",
                last: "/api/examples?per_page=2&page=6",
              },
              items: [
                {
                  id: 1,
                  sourceLanguage: "Finnish",
                  newWord: "sana numero-1",
                  content: "lause numero-1",
                  contentTranslation: "käännös numero-1",
                },
                {
                  id: 2,
                  sourceLanguage: "Finnish",
                  newWord: "sana numero-2",
                  content: "lause numero-2",
                  contentTranslation: "käännös numero-2",
                },
              ],
            },
          },
        ]);
      }
    );

    test(
      "fetchExamples()" +
        " + the HTTP request issued by that thunk-action is mocked to fail",
      async () => {
        /*
        TODO: (2023/10/30, 08:18)

              before submitting a pull request for review,
              ensure that each test has Arrange-Act-Assert comments
        */
        /* Arrange. */
        requestInterceptionLayer.use(
          rest.get("/api/examples", requestHandlers.mockSingleFailure)
        );

        /* Act. */
        const urlForOnePageOfExamples: string = "/api/examples";
        const fetchExamplesPromise = storeMock.dispatch(
          fetchExamples(urlForOnePageOfExamples)
        );

        /* Assert. */
        await expect(fetchExamplesPromise).rejects.toEqual(
          new Error("Request failed with status code 401")
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/fetchExamples/pending",
          },
          {
            type: "examples/fetchExamples/rejected",
            error:
              "[mocked] Authentication in the Basic Auth format is required.",
          },
        ]);
      }
    );

    test(
      "createExample(id, ...)" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        /* Arrange. */
        const rhf: RequestHandlingFacilitator =
          new RequestHandlingFacilitator();

        requestInterceptionLayer.use(
          rest.post("/api/examples", rhf.createMockCreateExample())
        );

        /* Act. */
        const createExamplePromise = storeMock.dispatch(
          createExample(
            MOCK_EXAMPLE.source_language,
            MOCK_EXAMPLE.new_word,
            MOCK_EXAMPLE.content,
            MOCK_EXAMPLE.content_translation
          )
        );

        /* Assert. */
        await expect(createExamplePromise).resolves.toEqual(undefined);
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/createExample/pending",
          },
          {
            type: "examples/createExample/fulfilled",
            payload: {
              id: 12,
              sourceLanguage: "Finnish",
              newWord: "varjo",
              content: "Suomen ideaalisää on 24 astetta varjossa.",
              contentTranslation:
                "Finland's ideal weather is 24 degrees in the shade.",
            },
          },
        ]);
      }
    );

    test(
      "createExample(id, ...)" +
        "+ the HTTP request issued by that thunk-action is mocked to fail",
      async () => {
        /* Arrange. */
        requestInterceptionLayer.use(
          rest.post("/api/examples", requestHandlers.mockSingleFailure)
        );

        /* Act. */
        const createExamplePromise = storeMock.dispatch(
          createExample(
            MOCK_EXAMPLE.source_language,
            MOCK_EXAMPLE.new_word,
            MOCK_EXAMPLE.content,
            MOCK_EXAMPLE.content_translation
          )
        );

        /* Assert. */
        await expect(createExamplePromise).rejects.toEqual(
          new Error("Request failed with status code 401")
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/createExample/pending",
          },
          {
            type: "examples/createExample/rejected",
            error:
              "[mocked] Authentication in the Basic Auth format is required.",
          },
        ]);
      }
    );

    test(
      "deleteExample(exampleId)" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        /* Arrange. */
        const rhf: RequestHandlingFacilitator =
          new RequestHandlingFacilitator();

        requestInterceptionLayer.use(
          rest.delete("/api/examples/:id", rhf.createMockDeleteExample())
        );

        /* Act. */
        const deleteExamplePromise = storeMock.dispatch(
          deleteExample(MOCK_EXAMPLE.id)
        );

        /* Assert. */
        await expect(deleteExamplePromise).resolves.toEqual(undefined);
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/deleteExample/pending",
          },
          {
            type: "examples/deleteExample/fulfilled",
            payload: {
              id: 17,
            },
          },
        ]);
      }
    );

    test(
      "deleteExample(exampleId)" +
        " + the HTTP request issued by that thunk-action is mocked to fail",
      async () => {
        /* Arrange. */
        requestInterceptionLayer.use(
          rest.delete("/api/examples/:id", requestHandlers.mockSingleFailure)
        );

        /* Act. */
        const deleteExamplePromise = storeMock.dispatch(
          deleteExample(MOCK_EXAMPLE.id)
        );

        /* Assert. */
        await expect(deleteExamplePromise).rejects.toEqual(
          new Error("Request failed with status code 401")
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/deleteExample/pending",
          },
          {
            type: "examples/deleteExample/rejected",
            error:
              "[mocked] Authentication in the Basic Auth format is required.",
          },
        ]);
      }
    );

    test(
      "editExample(exampleId, ...)" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        /* Arrange. */
        const rhf: RequestHandlingFacilitator =
          new RequestHandlingFacilitator();

        requestInterceptionLayer.use(
          rest.put("/api/examples/:id", rhf.createMockEditExample())
        );

        /* Act. */
        const editExamplePromise = storeMock.dispatch(
          editExample(MOCK_EXAMPLE_AT_IDX_7.id, {
            sourceLanguage: MOCK_EXAMPLE.source_language,
            newWord: MOCK_EXAMPLE.new_word,
            content: MOCK_EXAMPLE.content,
            contentTranslation: MOCK_EXAMPLE.content_translation,
          })
        );

        /* Assert. */
        await expect(editExamplePromise).resolves.toEqual(undefined);
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/editExample/pending",
          },
          {
            type: "examples/editExample/fulfilled",
            payload: {
              id: 8,
              sourceLanguage: "Finnish",
              newWord: "varjo",
              content: "Suomen ideaalisää on 24 astetta varjossa.",
              contentTranslation:
                "Finland's ideal weather is 24 degrees in the shade.",
            },
          },
        ]);
      }
    );

    test(
      "editExample(exampleId, ...)" +
        " + the HTTP request issued by that thunk-action is mocked to fail",
      async () => {
        /* Arrange. */
        requestInterceptionLayer.use(
          rest.put("/api/examples/:id", requestHandlers.mockSingleFailure)
        );

        /* Act. */
        const editExamplePromise = storeMock.dispatch(
          editExample(MOCK_EXAMPLE.id, {
            sourceLanguage: MOCK_EXAMPLE.source_language,
            newWord: MOCK_EXAMPLE.new_word,
            content: MOCK_EXAMPLE.content,
            contentTranslation: MOCK_EXAMPLE.content_translation,
          })
        );

        /* Assert. */
        await expect(editExamplePromise).rejects.toEqual(
          new Error("Request failed with status code 401")
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/editExample/pending",
          },
          {
            type: "examples/editExample/rejected",
            error:
              "[mocked] Authentication in the Basic Auth format is required.",
          },
        ]);
      }
    );
  }
);

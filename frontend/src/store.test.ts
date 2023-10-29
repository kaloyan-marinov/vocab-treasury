import {
  IAlert,
  RequestStatus,
  IProfile,
  IPaginationMeta,
  IPaginationLinks,
  IExample,
  IPaginationMetaFromBackend,
  IExampleFromBackend,
  IStateExamples,
} from "./types";
import { INITIAL_STATE_AUTH } from "./constants";

// 1
import {
  IState,
  INITIAL_STATE,
  selectAlertsIds,
  selectAlertsEntities,
} from "./store";

// 2
import { rest } from "msw";
import { setupServer } from "msw/node";
import thunkMiddleware, { ThunkDispatch } from "redux-thunk";
import { AnyAction } from "redux";
import configureMockStore, { MockStoreEnhanced } from "redux-mock-store";

// 3
import { profileMock } from "./dataMocks";

import {
  selectAuthRequestStatus,
  selectHasValidToken,
  selectLoggedInUserProfile,
} from "./store";

import {
  initialStateExamples,
  selectExamplesMeta,
  selectExamplesLinks,
  selectExamplesIds,
  selectExamplesEntities,
} from "./store";

import { fetchExamplesPending, fetchExamplesRejected } from "./store";

import { mockPaginationFromBackend } from "./dataMocks";
import { fetchExamplesFulfilled } from "./store";

import {
  examplesReducer,
  ActionTypesFetchExamples,
  IActionFetchExamplesPending,
  IActionFetchExamplesRejected,
  IActionFetchExamplesFulfilled,
} from "./store";

import { fetchExamples } from "./store";

import {
  ACTION_TYPE_EXAMPLES_CLEAR_SLICE,
  IActionExamplesClearSlice,
} from "./store";
import { convertToPaginationInFrontend } from "./helperFunctionsForTesting";
import { examplesClearSlice } from "./store";

import {
  createExamplePending,
  createExampleRejected,
  createExampleFulfilled,
  ActionTypesCreateExample,
  IActionCreateExamplePending,
  IActionCreateExampleRejected,
  IActionCreateExampleFulfilled,
} from "./store";
import { exampleMock } from "./dataMocks";
import { createExample } from "./store";

import {
  deleteExamplePending,
  deleteExampleRejected,
  deleteExampleFulfilled,
  ActionTypesDeleteExample,
  IActionDeleteExamplePending,
  IActionDeleteExampleRejected,
  IActionDeleteExampleFulfilled,
} from "./store";
import { deleteExample } from "./store";

// 4
import { examplesMock } from "./dataMocks";
import {
  editExamplePending,
  editExampleRejected,
  editExampleFulfilled,
  ActionTypesEditExample,
  IActionEditExamplePending,
  IActionEditExampleRejected,
  IActionEditExampleFulfilled,
  editExample,
} from "./store";

describe("selector functions", () => {
  let state: IState;

  beforeAll(() => {
    state = {
      alerts: {
        ids: ["alert-id-17"],
        entities: {
          "alert-id-17": {
            id: "alert-id-17",
            message: "PLEASE LOG IN.",
          },
        },
      },
      auth: {
        ...INITIAL_STATE_AUTH,
        requestStatus: RequestStatus.SUCCEEDED,
        loggedInUserProfile: {
          id: 17,
          username: "auth-jd",
          email: "auth-john.doe@protonmail.com",
        },
      },
      examples: {
        ...initialStateExamples,
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
      },
    };
  });

  test("selectAlertsIds", () => {
    const alertsIds: string[] = selectAlertsIds(state);

    expect(alertsIds).toEqual(["alert-id-17"]);
  });

  test("selectAlertsEntities", () => {
    const alertsEntities: { [alertId: string]: IAlert } =
      selectAlertsEntities(state);

    expect(alertsEntities).toEqual({
      "alert-id-17": {
        id: "alert-id-17",
        message: "PLEASE LOG IN.",
      },
    });
  });

  test("selectAuthRequestStatus", () => {
    const authRequestStatus: RequestStatus = selectAuthRequestStatus(state);

    expect(authRequestStatus).toEqual("succeeded");
  });

  test("selectHasValidToken", () => {
    const hasValidToken: boolean | null = selectHasValidToken(state);

    expect(hasValidToken).toEqual(null);
  });

  test("selectLoggedInUserProfile", () => {
    const loggedInUserProfile: IProfile | null =
      selectLoggedInUserProfile(state);

    expect(loggedInUserProfile).toEqual({
      id: 17,
      username: "auth-jd",
      email: "auth-john.doe@protonmail.com",
    });
  });

  test("selectExamplesMeta", () => {
    const meta: IPaginationMeta = selectExamplesMeta(state);

    expect(meta).toEqual({
      totalItems: 11,
      perPage: 2,
      totalPages: 6,
      page: 1,
    });
  });

  test("selectExamplesLinks", () => {
    const links: IPaginationLinks = selectExamplesLinks(state);

    expect(links).toEqual({
      self: "/api/examples?per_page=2&page=1",
      next: "/api/examples?per_page=2&page=2",
      prev: null,
      first: "/api/examples?per_page=2&page=1",
      last: "/api/examples?per_page=2&page=6",
    });
  });

  test("selectExamplesIds", () => {
    const ids: number[] = selectExamplesIds(state);

    expect(ids).toEqual([1, 2]);
  });

  test("selectExamplesEntities", () => {
    const entities: { [exampleId: string]: IExample } =
      selectExamplesEntities(state);

    expect(entities).toEqual({
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
    });
  });
});

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
      examplesMock,
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
      examplesMock,
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

describe("slice reducers", () => {
  describe("examplesReducer", () => {
    test("examples/fetchExamples/pending", () => {
      const initState: IStateExamples = {
        ...initialStateExamples,
        requestStatus: RequestStatus.FAILED,
        requestError: "error-fetchExamples-rejected",
      };
      const action: IActionFetchExamplesPending = {
        type: ActionTypesFetchExamples.PENDING,
      };

      const newState: IStateExamples = examplesReducer(initState, action);

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
      const initState: IStateExamples = {
        ...initialStateExamples,
        requestStatus: RequestStatus.LOADING,
      };
      const action: IActionFetchExamplesRejected = {
        type: ActionTypesFetchExamples.REJECTED,
        error: "examples-fetchExamples-rejected",
      };

      const newState: IStateExamples = examplesReducer(initState, action);

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
      const initState: IStateExamples = {
        ...initialStateExamples,
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
      } = mockPaginationFromBackend(examplesMock, perPage, page);

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
      const newState: IStateExamples = examplesReducer(initState, action);

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
      } = mockPaginationFromBackend(examplesMock, perPage, page);

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

      const initState: IStateExamples = {
        ...initialStateExamples,
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
      const newState: IStateExamples = examplesReducer(initState, action);

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
      const initState: IStateExamples = {
        ...initialStateExamples,
        requestStatus: RequestStatus.FAILED,
        requestError: "examples-createExample-rejected",
      };
      const action: IActionCreateExamplePending = {
        type: ActionTypesCreateExample.PENDING,
      };

      const newState: IStateExamples = examplesReducer(initState, action);

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
      const initState: IStateExamples = {
        ...initialStateExamples,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };
      const action: IActionCreateExampleRejected = {
        type: ActionTypesCreateExample.REJECTED,
        error: "examples-createExample-rejected",
      };

      const newState: IStateExamples = examplesReducer(initState, action);

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
      } = mockPaginationFromBackend(examplesMock, perPage, page);
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

      const initState: IStateExamples = {
        ...initialStateExamples,
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
          contentTranslation:
            "There is unusually hot weather in North America.",
        },
      };

      /* Act. */
      const newState: IStateExamples = examplesReducer(initState, action);

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
      const initState: IStateExamples = {
        ...initialStateExamples,
        requestStatus: RequestStatus.FAILED,
        requestError: "examples-deleteExample-rejected",
      };
      const action: IActionDeleteExamplePending = {
        type: ActionTypesDeleteExample.PENDING,
      };

      const newState: IStateExamples = examplesReducer(initState, action);

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
      const initState: IStateExamples = {
        ...initialStateExamples,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };
      const action: IActionDeleteExampleRejected = {
        type: ActionTypesDeleteExample.REJECTED,
        error: "examples-deleteExample-rejected",
      };

      const newState: IStateExamples = examplesReducer(initState, action);

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
      } = mockPaginationFromBackend(examplesMock, perPage, page);
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

      const initState: IStateExamples = {
        ...initialStateExamples,
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
      const newState: IStateExamples = examplesReducer(initState, action);

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
      const initState: IStateExamples = {
        ...initialStateExamples,
        requestStatus: RequestStatus.FAILED,
        requestError: "examples-editExample-rejected",
      };
      const action: IActionEditExamplePending = {
        type: ActionTypesEditExample.PENDING,
      };

      const newState: IStateExamples = examplesReducer(initState, action);

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
      const initState: IStateExamples = {
        ...initialStateExamples,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };
      const action: IActionEditExampleRejected = {
        type: ActionTypesEditExample.REJECTED,
        error: "examples-editExample-rejected",
      };

      const newState: IStateExamples = examplesReducer(initState, action);

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
      } = mockPaginationFromBackend(examplesMock, perPage, page);
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

      const initState: IStateExamples = {
        ...initialStateExamples,
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
      const newState: IStateExamples = examplesReducer(initState, action);

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
});

/* A function, which creates and returns a _correctly-typed_ mock of a Redux store. */
const createStoreMock = configureMockStore<
  IState,
  ThunkDispatch<IState, any, AnyAction>
>([thunkMiddleware]);

/* Describe what requests should be mocked. */
const requestHandlersToMock = [
  rest.post("/api/users", (req, res, ctx) => {
    return res(
      ctx.status(201),
      ctx.json({
        id: 17,
        username: "mocked-request-jd",
      })
    );
  }),

  rest.post("/api/tokens", (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        token: "mocked-token",
      })
    );
  }),

  rest.get("/api/user-profile", (req, res, ctx) => {
    return res(ctx.status(200), ctx.json(profileMock));
  }),

  rest.get("/api/examples", (req, res, ctx) => {
    const perPage: number = 2;
    const page: number = parseInt(req.url.searchParams.get("page") || "1");

    return res(
      ctx.status(200),
      ctx.json(mockPaginationFromBackend(examplesMock, perPage, page))
    );
  }),

  rest.post("/api/examples", (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(exampleMock));
  }),

  rest.delete("/api/examples/:id", (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  rest.put("/api/examples/:id", (req, res, ctx) => {
    const { id: exampleId } = req.params;

    return res(
      ctx.status(200),
      ctx.json({
        ...exampleMock,
        id: parseInt(exampleId),
      })
    );
  }),

  rest.post("/api/request-password-reset", (req, res, ctx) => {
    return res(
      ctx.status(202),
      ctx.json({
        message:
          "Sending an email with instructions for resetting your password...",
      })
    );
  }),
];

/* Create an MSW "request-interception layer". */
const quasiServer = setupServer(...requestHandlersToMock);

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
      quasiServer.listen();
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
      quasiServer.resetHandlers();
    });

    afterAll(() => {
      /*
      Prevent the established request-interception layer
      from affecting irrelevant tests
      by tearing down that layer
      (= Stop request interception)
      (= Disable API mocking).
      */
      quasiServer.close();
    });

    test(
      "fetchExamples()" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        const urlForOnePageOfExamples: string = "/api/examples";
        const fetchExamplesPromise = storeMock.dispatch(
          fetchExamples(urlForOnePageOfExamples)
        );

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
        quasiServer.use(
          rest.get("/api/examples", (req, res, ctx) => {
            return res(
              ctx.status(401),
              ctx.json({
                error: "[mocked] Unauthorized",
                message: "[mocked] Expired access token.",
              })
            );
          })
        );

        const urlForOnePageOfExamples: string = "/api/examples";
        const fetchExamplesPromise = storeMock.dispatch(
          fetchExamples(urlForOnePageOfExamples)
        );

        await expect(fetchExamplesPromise).rejects.toEqual(
          new Error("Request failed with status code 401")
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/fetchExamples/pending",
          },
          {
            type: "examples/fetchExamples/rejected",
            error: "[mocked] Expired access token.",
          },
        ]);
      }
    );

    test(
      "createExample(id, ...)" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        const createExamplePromise = storeMock.dispatch(
          createExample(
            exampleMock.source_language,
            exampleMock.new_word,
            exampleMock.content,
            exampleMock.content_translation
          )
        );

        await expect(createExamplePromise).resolves.toEqual(undefined);
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/createExample/pending",
          },
          {
            type: "examples/createExample/fulfilled",
            payload: {
              id: 17,
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
        quasiServer.use(
          rest.post("/api/examples", (req, res, ctx) => {
            return res(
              ctx.status(401),
              ctx.json({
                error: "[mocked] Unauthorized",
                message: "[mocked] Expired access token.",
              })
            );
          })
        );

        const createExamplePromise = storeMock.dispatch(
          createExample(
            exampleMock.source_language,
            exampleMock.new_word,
            exampleMock.content,
            exampleMock.content_translation
          )
        );

        await expect(createExamplePromise).rejects.toEqual(
          new Error("Request failed with status code 401")
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/createExample/pending",
          },
          {
            type: "examples/createExample/rejected",
            error: "[mocked] Expired access token.",
          },
        ]);
      }
    );

    test(
      "deleteExample(exampleId)" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        const deleteExamplePromise = storeMock.dispatch(
          deleteExample(exampleMock.id)
        );

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
        quasiServer.use(
          rest.delete("/api/examples/:id", (req, res, ctx) => {
            return res(
              ctx.status(401),
              ctx.json({
                error: "[mocked] Unauthorized",
                message: "[mocked] Expired access token.",
              })
            );
          })
        );

        const deleteExamplePromise = storeMock.dispatch(
          deleteExample(exampleMock.id)
        );

        await expect(deleteExamplePromise).rejects.toEqual(
          new Error("Request failed with status code 401")
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/deleteExample/pending",
          },
          {
            type: "examples/deleteExample/rejected",
            error: "[mocked] Expired access token.",
          },
        ]);
      }
    );

    test(
      "editExample(exampleId, ...)" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        const editExamplePromise = storeMock.dispatch(
          editExample(exampleMock.id, {
            sourceLanguage: exampleMock.source_language,
            newWord: exampleMock.new_word,
            content: exampleMock.content,
            contentTranslation: exampleMock.content_translation,
          })
        );

        await expect(editExamplePromise).resolves.toEqual(undefined);
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/editExample/pending",
          },
          {
            type: "examples/editExample/fulfilled",
            payload: {
              id: 17,
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
        quasiServer.use(
          rest.put("/api/examples/:id", (req, res, ctx) => {
            return res(
              ctx.status(401),
              ctx.json({
                error: "[mocked] Unauthorized",
                message: "[mocked] Expired access token.",
              })
            );
          })
        );

        const editExamplePromise = storeMock.dispatch(
          editExample(exampleMock.id, {
            sourceLanguage: exampleMock.source_language,
            newWord: exampleMock.new_word,
            content: exampleMock.content,
            contentTranslation: exampleMock.content_translation,
          })
        );

        await expect(editExamplePromise).rejects.toEqual(
          new Error("Request failed with status code 401")
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "examples/editExample/pending",
          },
          {
            type: "examples/editExample/rejected",
            error: "[mocked] Expired access token.",
          },
        ]);
      }
    );
  }
);

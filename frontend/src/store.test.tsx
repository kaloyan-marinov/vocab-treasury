// 1
import {
  IAlert,
  IState,
  initialState,
  selectAlertsIds,
  selectAlertsEntities,
  ActionTypesAlerts,
  IActionAlertsCreate,
  IActionAlertsRemove,
  alertsCreate,
  alertsRemove,
  RequestStatus,
  createUserPending,
  createUserRejected,
  createUserFulfilled,
  IActionCreateUserPending,
  ActionTypesCreateUser,
  IActionCreateUserRejected,
  IActionCreateUserFulfilled,
} from "./store";

// 2
import { rest } from "msw";
import { setupServer } from "msw/node";
import thunkMiddleware, { ThunkDispatch } from "redux-thunk";
import { AnyAction } from "redux";
import configureMockStore, { MockStoreEnhanced } from "redux-mock-store";

import { createUser } from "./store";

// 3
import {
  IStateAlerts,
  initialStateAlerts,
  alertsReducer,
  IStateAuth,
  initialStateAuth,
  authReducer,
} from "./store";

import {
  ActionTypesIssueJWSToken,
  issueJWSTokenPending,
  IActionIssueJWSTokenPending,
  issueJWSTokenRejected,
  IActionIssueJWSTokenRejected,
  issueJWSTokenFulfilled,
  IActionIssueJWSTokenFulfilled,
  issueJWSToken,
} from "./store";

import {
  VOCAB_TREASURY_APP_TOKEN,
  ACTION_TYPE_AUTH_CLEAR_SLICE,
  IActionAuthClearSlice,
  authClearSlice,
  logOut,
} from "./store";

import {
  ActionTypesFetchProfile,
  fetchProfilePending,
  IActionFetchProfilePending,
  fetchProfileRejected,
  IActionFetchProfileRejected,
  fetchProfileFulfilled,
  IActionFetchProfileFulfilled,
  IProfile,
} from "./store";
import { profileMock } from "./dataMocks";
import { fetchProfile } from "./store";

import {
  selectAuthRequestStatus,
  selectHasValidToken,
  selectLoggedInUserProfile,
} from "./store";

import {
  initialStateExamples,
  IPaginationMeta,
  selectExamplesMeta,
  IPaginationLinks,
  selectExamplesLinks,
  IExample,
  selectExamplesIds,
  selectExamplesEntities,
} from "./store";

import { fetchExamplesPending, fetchExamplesRejected } from "./store";

import { mockPaginationFromBackend } from "./dataMocks";
import {
  IPaginationMetaFromBackend,
  IExampleFromBackend,
  fetchExamplesFulfilled,
} from "./store";

import {
  examplesReducer,
  IStateExamples,
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
        ...initialStateAuth,
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
            newWord: "sana #1",
            content: "lause #1",
            contentTranslation: "käännös #1",
          },
          "2": {
            id: 2,
            sourceLanguage: "Finnish",
            newWord: "sana #2",
            content: "lause #2",
            contentTranslation: "käännös #2",
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
        newWord: "sana #1",
        content: "lause #1",
        contentTranslation: "käännös #1",
      },
      "2": {
        id: 2,
        sourceLanguage: "Finnish",
        newWord: "sana #2",
        content: "lause #2",
        contentTranslation: "käännös #2",
      },
    });
  });
});

describe("action creators", () => {
  test("alertsCreate", () => {
    const action = alertsCreate("alert-id-17", "PLEASE LOG IN.");

    expect(action).toEqual({
      type: "alerts/create",
      payload: {
        id: "alert-id-17",
        message: "PLEASE LOG IN.",
      },
    });
  });

  test("alertsRemove", () => {
    const action = alertsRemove("alert-id-17");

    expect(action).toEqual({
      type: "alerts/remove",
      payload: {
        id: "alert-id-17",
      },
    });
  });

  test("createUserPending", () => {
    const action = createUserPending();

    expect(action).toEqual({
      type: "auth/createUser/pending",
    });
  });

  test("createUserRejected", () => {
    const action = createUserRejected("auth-createUser-rejected");

    expect(action).toEqual({
      type: "auth/createUser/rejected",
      error: "auth-createUser-rejected",
    });
  });

  test("createUserFulfilled", () => {
    const action = createUserFulfilled();

    expect(action).toEqual({
      type: "auth/createUser/fulfilled",
    });
  });

  test("issueJWSTokenPending", () => {
    const action = issueJWSTokenPending();

    expect(action).toEqual({
      type: "auth/issueJWSToken/pending",
    });
  });

  test("issueJWSTokenRejected", () => {
    const action = issueJWSTokenRejected("auth-issueJWSToken-rejected");

    expect(action).toEqual({
      type: "auth/issueJWSToken/rejected",
      error: "auth-issueJWSToken-rejected",
    });
  });

  test("issueJWSTokenFulfilled", () => {
    const action = issueJWSTokenFulfilled("token-issued-by-the-backend");

    expect(action).toEqual({
      type: "auth/issueJWSToken/fulfilled",
      payload: {
        token: "token-issued-by-the-backend",
      },
    });
  });

  test("fetchProfilePending", () => {
    const action = fetchProfilePending();

    expect(action).toEqual({
      type: "auth/fetchProfile/pending",
    });
  });

  test("fetchProfileRejected", () => {
    const action = fetchProfileRejected("auth-fetchProfile-rejected");

    expect(action).toEqual({
      type: "auth/fetchProfile/rejected",
      error: "auth-fetchProfile-rejected",
    });
  });

  test("fetchProfileFulfilled", () => {
    const profile: IProfile = {
      id: 17,
      username: "mocked-jd",
      email: "mocked-john.doe@protonmail.com",
    };
    const action = fetchProfileFulfilled(profile);

    expect(action).toEqual({
      type: "auth/fetchProfile/fulfilled",
      payload: {
        profile: {
          id: 17,
          username: "mocked-jd",
          email: "mocked-john.doe@protonmail.com",
        },
      },
    });
  });

  test("authClearSlice", () => {
    const action = authClearSlice();

    expect(action).toEqual({
      type: "auth/clearSlice",
    });
  });

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
        new_word: "sana #1",
        content: "lause #1",
        content_translation: "käännös #1",
      },
      {
        id: 2,
        source_language: "Finnish",
        new_word: "sana #2",
        content: "lause #2",
        content_translation: "käännös #2",
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
            newWord: "sana #1",
            content: "lause #1",
            contentTranslation: "käännös #1",
          },
          {
            id: 2,
            sourceLanguage: "Finnish",
            newWord: "sana #2",
            content: "lause #2",
            contentTranslation: "käännös #2",
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
});

describe("slice reducers", () => {
  describe("alertsReducer", () => {
    test("alerts/create", () => {
      const initState: IStateAlerts = {
        ...initialStateAlerts,
      };
      const action: IActionAlertsCreate = {
        type: ActionTypesAlerts.CREATE,
        payload: {
          id: "alert-id-17",
          message: "PLEASE LOG IN.",
        },
      };

      const newState: IStateAlerts = alertsReducer(initState, action);

      expect(newState).toEqual({
        ids: ["alert-id-17"],
        entities: {
          "alert-id-17": {
            id: "alert-id-17",
            message: "PLEASE LOG IN.",
          },
        },
      });
    });

    test("alerts/remove", () => {
      const initState: IStateAlerts = {
        ...initialStateAlerts,
        ids: ["alert-id-17"],
        entities: {
          "alert-id-17": {
            id: "alert-id-17",
            message: "PLEASE LOG IN.",
          },
        },
      };
      const action: IActionAlertsRemove = {
        type: ActionTypesAlerts.REMOVE,
        payload: {
          id: "alert-id-17",
        },
      };

      const newState: IStateAlerts = alertsReducer(initState, action);

      expect(newState).toEqual({
        ids: [],
        entities: {},
      });
    });
  });

  describe("authReducer", () => {
    test("auth/createUser/pending", () => {
      const initState: IStateAuth = {
        ...initialStateAuth,
        requestStatus: RequestStatus.FAILED,
        requestError: "auth-createUser-rejected",
      };
      const action: IActionCreateUserPending = {
        type: ActionTypesCreateUser.PENDING,
      };

      const newState: IStateAuth = authReducer(initState, action);

      expect(newState).toEqual({
        requestStatus: RequestStatus.LOADING,
        requestError: null,
        token: null,
        hasValidToken: null,
        loggedInUserProfile: null,
      });
    });

    test("auth/createUser/rejected", () => {
      const initState: IStateAuth = {
        ...initialStateAuth,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };
      const action: IActionCreateUserRejected = {
        type: ActionTypesCreateUser.REJECTED,
        error: "auth-createUser-rejected",
      };

      const newState: IStateAuth = authReducer(initState, action);

      expect(newState).toEqual({
        requestStatus: RequestStatus.FAILED,
        requestError: "auth-createUser-rejected",
        token: null,
        hasValidToken: null,
        loggedInUserProfile: null,
      });
    });

    test("auth/createUser/fulfilled", () => {
      const initState: IStateAuth = {
        ...initialStateAuth,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };
      const action: IActionCreateUserFulfilled = {
        type: ActionTypesCreateUser.FULFILLED,
      };

      const newState: IStateAuth = authReducer(initState, action);

      expect(newState).toEqual({
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
        token: null,
        hasValidToken: null,
        loggedInUserProfile: null,
      });
    });

    test("auth/issueJWSToken/pending", () => {
      const initState: IStateAuth = {
        ...initialStateAuth,
        requestStatus: RequestStatus.FAILED,
        requestError: "auth-issueJWSToken-rejected",
      };
      const action: IActionIssueJWSTokenPending = {
        type: ActionTypesIssueJWSToken.PENDING,
      };

      const newState: IStateAuth = authReducer(initState, action);

      expect(newState).toEqual({
        requestStatus: RequestStatus.LOADING,
        requestError: null,
        token: null,
        hasValidToken: null,
        loggedInUserProfile: null,
      });
    });

    test("auth/issueJWSToken/rejected", () => {
      const initState: IStateAuth = {
        ...initialStateAuth,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };
      const action: IActionIssueJWSTokenRejected = {
        type: ActionTypesIssueJWSToken.REJECTED,
        error: "auth-issueJWSToken-rejected",
      };

      const newState: IStateAuth = authReducer(initState, action);

      expect(newState).toEqual({
        requestStatus: RequestStatus.FAILED,
        requestError: "auth-issueJWSToken-rejected",
        token: null,
        hasValidToken: false,
        loggedInUserProfile: null,
      });
    });

    test("auth/issueJWSToken/fulfilled", () => {
      const initState: IStateAuth = {
        ...initialStateAuth,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };
      const action: IActionIssueJWSTokenFulfilled = {
        type: ActionTypesIssueJWSToken.FULFILLED,
        payload: {
          token: "token-issued-by-the-backend",
        },
      };

      const newState: IStateAuth = authReducer(initState, action);

      expect(newState).toEqual({
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
        token: "token-issued-by-the-backend",
        hasValidToken: true,
        loggedInUserProfile: null,
      });
    });

    test("auth/fetchProfile/pending", () => {
      const initState: IStateAuth = {
        ...initialStateAuth,
        requestStatus: RequestStatus.FAILED,
        requestError: "auth-fetchProfile-rejected",
        token: "token-that-was-loaded-from-localStorage-but-is-no-longer-valid",
      };
      const action: IActionFetchProfilePending = {
        type: ActionTypesFetchProfile.PENDING,
      };

      const newState: IStateAuth = authReducer(initState, action);

      expect(newState).toEqual({
        requestStatus: RequestStatus.LOADING,
        requestError: null,
        token: "token-that-was-loaded-from-localStorage-but-is-no-longer-valid",
        hasValidToken: null,
        loggedInUserProfile: null,
      });
    });

    test("auth/fetchProfile/rejected", () => {
      const initState: IStateAuth = {
        ...initialStateAuth,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
        token: "token-that-was-loaded-from-localStorage-but-is-no-longer-valid",
      };
      const action: IActionFetchProfileRejected = {
        type: ActionTypesFetchProfile.REJECTED,
        error: "auth-fetchProfile-rejected",
      };

      const newState: IStateAuth = authReducer(initState, action);

      expect(newState).toEqual({
        requestStatus: RequestStatus.FAILED,
        requestError: "auth-fetchProfile-rejected",
        token: "token-that-was-loaded-from-localStorage-but-is-no-longer-valid",
        hasValidToken: false,
        loggedInUserProfile: null,
      });
    });

    test("auth/fetchProfile/fulfilled", () => {
      const initState: IStateAuth = {
        ...initialStateAuth,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
        token: "token-that-was-loaded-from-localStorate-and-is-still-valid",
      };
      const action: IActionFetchProfileFulfilled = {
        type: ActionTypesFetchProfile.FULFILLED,
        payload: {
          profile: {
            id: 17,
            username: "mocked-jd",
            email: "mocked-john.doe@protonmail.com",
          },
        },
      };

      const newState: IStateAuth = authReducer(initState, action);

      expect(newState).toEqual({
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
        token: "token-that-was-loaded-from-localStorate-and-is-still-valid",
        hasValidToken: true,
        loggedInUserProfile: {
          id: 17,
          username: "mocked-jd",
          email: "mocked-john.doe@protonmail.com",
        },
      });
    });

    test("auth/clearSlice", () => {
      const initState: IStateAuth = {
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
        token: "token-issued-by-the-backend",
        hasValidToken: true,
        loggedInUserProfile: {
          id: 17,
          username: "mocked-jd",
          email: "mocked-john.doe@protonmail.com",
        },
      };
      const action: IActionAuthClearSlice = {
        type: ACTION_TYPE_AUTH_CLEAR_SLICE,
      };

      const newState: IStateAuth = authReducer(initState, action);

      expect(newState).toEqual({
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
        token: null,
        hasValidToken: false,
        loggedInUserProfile: null,
      });
    });
  });

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
            newWord: "sana #1",
            content: "lause #1",
            contentTranslation: "käännös #1",
          },
          "2": {
            id: 2,
            sourceLanguage: "Finnish",
            newWord: "sana #2",
            content: "lause #2",
            contentTranslation: "käännös #2",
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
            newWord: "sana #3",
            content: "lause #3",
            contentTranslation: "käännös #3",
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
      initState = { ...initialState };
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
      "createUser(username, ...)" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        const createUserPromise = storeMock.dispatch(
          createUser(
            "mocked-username",
            "mocked-email@protonmail.com",
            "mocked-password"
          )
        );

        await expect(createUserPromise).resolves.toEqual(undefined);
        expect(storeMock.getActions()).toEqual([
          { type: "auth/createUser/pending" },
          { type: "auth/createUser/fulfilled" },
        ]);
      }
    );

    test(
      "createUser(username, ...)" +
        " + the HTTP request issued by that thunk-action is mocked to fail",
      async () => {
        quasiServer.use(
          rest.post("/api/users", (req, res, ctx) => {
            return res(
              ctx.status(400),
              ctx.json({
                error: "[mocked] Bad Request",
                message: "[mocked] The provided email is already taken.",
              })
            );
          })
        );

        const createUserPromise = storeMock.dispatch(
          createUser(
            "mocked-username",
            "mocked-email@protonmail.com",
            "mocked-password"
          )
        );

        await expect(createUserPromise).rejects.toEqual(
          "[mocked] The provided email is already taken."
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "auth/createUser/pending",
          },
          {
            type: "auth/createUser/rejected",
            error: "[mocked] The provided email is already taken.",
          },
        ]);
      }
    );

    test(
      "issueJWSToken(email, password)" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        const issueJWSTokenPromise = storeMock.dispatch(
          issueJWSToken("mocked-email@protonmail.com", "mocked-password")
        );

        await expect(issueJWSTokenPromise).resolves.toEqual(undefined);
        expect(storeMock.getActions()).toEqual([
          {
            type: "auth/issueJWSToken/pending",
          },
          {
            type: "auth/issueJWSToken/fulfilled",
            payload: {
              token: "mocked-token",
            },
          },
        ]);
      }
    );

    test(
      "issueJWSToken(email, password)" +
        " + the HTTP request issued by that thunk-action is mocked to fail",
      async () => {
        quasiServer.use(
          rest.post("/api/tokens", (req, res, ctx) => {
            return res(
              ctx.status(401),
              ctx.json({
                error: "[mocked] Unauthorized",
                message: "[mocked] Incorrect email and/or password.",
              })
            );
          })
        );

        const issueJWSTokenPromise = storeMock.dispatch(
          issueJWSToken("mocked-email@protonmail.com", "mocked-password")
        );

        await expect(issueJWSTokenPromise).rejects.toEqual(
          "[mocked] Incorrect email and/or password."
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "auth/issueJWSToken/pending",
          },
          {
            type: "auth/issueJWSToken/rejected",
            error: "[mocked] Incorrect email and/or password.",
          },
        ]);
      }
    );

    test(
      "fetchProfile()" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        const fetchProfilePromise = storeMock.dispatch(fetchProfile());

        await expect(fetchProfilePromise).resolves.toEqual(undefined);
        expect(storeMock.getActions()).toEqual([
          {
            type: "auth/fetchProfile/pending",
          },
          {
            type: "auth/fetchProfile/fulfilled",
            payload: {
              profile: profileMock,
            },
          },
        ]);
      }
    );

    test(
      "fetchProfile()" +
        " + the HTTP request issued by that thunk-action is mocked to fail",
      async () => {
        quasiServer.use(
          rest.get("/api/user-profile", (req, res, ctx) => {
            return res(
              ctx.status(401),
              ctx.json({
                error: "[mocked] Unauthorized",
                message: "[mocked] Expired access token.",
              })
            );
          })
        );

        const fetchProfilePromise = storeMock.dispatch(fetchProfile());

        await expect(fetchProfilePromise).rejects.toEqual(
          "[mocked] Expired access token."
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "auth/fetchProfile/pending",
          },
          {
            type: "auth/fetchProfile/rejected",
            error: "[mocked] Expired access token.",
          },
        ]);
      }
    );

    test(
      "logOut()" +
        " [Note: (a) not an async thunk-action," +
        " and (b) does not dependent on mocking of any HTTP requests]",
      () => {
        /* Arrange. */
        localStorage.setItem(
          VOCAB_TREASURY_APP_TOKEN,
          "token-issued-by-the-backend"
        );

        /* Act. */
        storeMock.dispatch(logOut("LOGOUT SUCCESSFUL"));

        /* Assert. */
        const dispatchedActions = storeMock.getActions();

        expect(dispatchedActions.length).toEqual(3);

        expect(dispatchedActions[0]).toEqual({
          type: "auth/clearSlice",
        });

        expect(dispatchedActions[1]).toEqual({
          type: "examples/clearSlice",
        });

        expect({
          type: dispatchedActions[2].type,
          payload: {
            message: dispatchedActions[2].payload.message,
          },
        }).toEqual({
          type: "alerts/create",
          payload: {
            message: "LOGOUT SUCCESSFUL",
          },
        });

        expect(localStorage.getItem(VOCAB_TREASURY_APP_TOKEN)).toEqual(null);
      }
    );

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
                  newWord: "sana #1",
                  content: "lause #1",
                  contentTranslation: "käännös #1",
                },
                {
                  id: 2,
                  sourceLanguage: "Finnish",
                  newWord: "sana #2",
                  content: "lause #2",
                  contentTranslation: "käännös #2",
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
  }
);

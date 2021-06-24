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

describe("selector functions", () => {
  let state: IState;

  beforeAll(() => {
    state = {
      ...initialState,
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
        storeMock.dispatch(logOut());

        /* Assert. */
        const dispatchedActions = storeMock.getActions();

        expect(dispatchedActions.length).toEqual(2);

        expect(dispatchedActions[0]).toEqual({
          type: "auth/clearSlice",
        });

        expect({
          type: dispatchedActions[1].type,
          payload: {
            message: dispatchedActions[1].payload.message,
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
  }
);

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
  }
);

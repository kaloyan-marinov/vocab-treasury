import { setupServer, SetupServer } from "msw/node";
import { MockStoreEnhanced } from "redux-mock-store";
import configureMockStore from "redux-mock-store";
import thunkMiddleware, { ThunkDispatch } from "redux-thunk";
import { rest } from "msw";
import { AnyAction } from "redux";

import { RequestStatus, IProfile, IStateAuth, IState } from "../../types";
import { INITIAL_STATE_AUTH, VOCAB_TREASURY_APP_TOKEN } from "../../constants";
import { MOCK_PROFILE } from "../../mockPiecesOfData";
import {
  requestHandlers,
  createMockOneOrManyFailures,
} from "../../testHelpers";
import { logOut, INITIAL_STATE } from "../../store";
import {
  ActionTypesCreateUser,
  IActionCreateUserPending,
  IActionCreateUserRejected,
  IActionCreateUserFulfilled,
  createUserPending,
  createUserRejected,
  createUserFulfilled,
  createUser,
  ActionTypesConfirmEmailAddress,
  IActionConfirmEmailAddressPending,
  IActionConfirmEmailAddressRejected,
  IActionConfirmEmailAddressFulfilled,
  confirmEmailAddressPending,
  confirmEmailAddressRejected,
  confirmEmailAddressFulfilled,
  confirmEmailAddress,
  ActionTypesIssueJWSToken,
  IActionIssueJWSTokenPending,
  IActionIssueJWSTokenRejected,
  IActionIssueJWSTokenFulfilled,
  issueJWSTokenPending,
  issueJWSTokenRejected,
  issueJWSTokenFulfilled,
  issueJWSToken,
  ActionTypesFetchProfile,
  IActionFetchProfilePending,
  IActionFetchProfileRejected,
  IActionFetchProfileFulfilled,
  fetchProfilePending,
  fetchProfileRejected,
  fetchProfileFulfilled,
  fetchProfile,
  ActionTypesRequestPasswordReset,
  IActionRequestPasswordResetPending,
  IActionRequestPasswordResetRejected,
  IActionRequestPasswordResetFulfilled,
  requestPasswordResetPending,
  requestPasswordResetRejected,
  requestPasswordResetFulfilled,
  requestPasswordReset,
  ACTION_TYPE_AUTH_CLEAR_SLICE,
  IActionAuthClearSlice,
  authClearSlice,
  authReducer,
} from "./authSlice";

describe("action creators", () => {
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

  test("confirmEmailAddressPending", () => {
    const action = confirmEmailAddressPending();

    expect(action).toEqual({
      type: "auth/confirmEmailAddress/pending",
    });
  });

  test("confirmEmailAddressRejected", () => {
    const action = confirmEmailAddressRejected(
      "auth-confirmEmailAddress-rejected"
    );

    expect(action).toEqual({
      type: "auth/confirmEmailAddress/rejected",
      error: "auth-confirmEmailAddress-rejected",
    });
  });

  test("confirmEmailAddressFulfilled", () => {
    const action = confirmEmailAddressFulfilled(
      "EMAIL-ADDRESS CONFIRMATION SUCCESSFUL - YOU MAY NOW LOG IN."
    );

    expect(action).toEqual({
      type: "auth/confirmEmailAddress/fulfilled",
      payload: {
        message: "EMAIL-ADDRESS CONFIRMATION SUCCESSFUL - YOU MAY NOW LOG IN.",
      },
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

  test("requestPasswordResetPending", () => {
    const action = requestPasswordResetPending();

    expect(action).toEqual({
      type: "auth/requestPasswordReset/pending",
    });
  });

  test("requestPasswordResetRejected", () => {
    const action = requestPasswordResetRejected(
      "auth-requestPasswordReset-rejected"
    );

    expect(action).toEqual({
      type: "auth/requestPasswordReset/rejected",
      error: "auth-requestPasswordReset-rejected",
    });
  });

  test("requestPasswordResetFulfilled", () => {
    const action = requestPasswordResetFulfilled();

    expect(action).toEqual({
      type: "auth/requestPasswordReset/fulfilled",
    });
  });

  test("authClearSlice", () => {
    const action = authClearSlice();

    expect(action).toEqual({
      type: "auth/clearSlice",
    });
  });
});

describe("reducer", () => {
  let initStAuth: IStateAuth;

  beforeEach(() => {
    initStAuth = {
      ...INITIAL_STATE_AUTH,
    };
  });

  test("auth/createUser/pending", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.FAILED,
      requestError: "auth-createUser-rejected",
    };
    const action: IActionCreateUserPending = {
      type: ActionTypesCreateUser.PENDING,
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.LOADING,
      requestError: null,
      token: null,
      hasValidToken: null,
      loggedInUserProfile: null,
    });
  });

  test("auth/createUser/rejected", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
    };
    const action: IActionCreateUserRejected = {
      type: ActionTypesCreateUser.REJECTED,
      error: "auth-createUser-rejected",
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.FAILED,
      requestError: "auth-createUser-rejected",
      token: null,
      hasValidToken: null,
      loggedInUserProfile: null,
    });
  });

  test("auth/createUser/fulfilled", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
    };
    const action: IActionCreateUserFulfilled = {
      type: ActionTypesCreateUser.FULFILLED,
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.SUCCEEDED,
      requestError: null,
      token: null,
      hasValidToken: null,
      loggedInUserProfile: null,
    });
  });

  test("auth/confirmEmailAddress/pending", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.FAILED,
      requestError: "auth-confirmEmailAddress-rejected",
    };
    const action: IActionConfirmEmailAddressPending = {
      type: ActionTypesConfirmEmailAddress.PENDING,
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.LOADING,
      requestError: null,
      token: null,
      hasValidToken: null,
      loggedInUserProfile: null,
    });
  });

  test("auth/confirmEmailAddress/rejected", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
    };
    const action: IActionConfirmEmailAddressRejected = {
      type: ActionTypesConfirmEmailAddress.REJECTED,
      error: "auth-confirmEmailAddress-rejected",
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.FAILED,
      requestError: "auth-confirmEmailAddress-rejected",
      token: null,
      hasValidToken: null,
      loggedInUserProfile: null,
    });
  });

  test("auth/confirmEmailAddress/fulfilled", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
    };
    const action: IActionConfirmEmailAddressFulfilled = {
      type: ActionTypesConfirmEmailAddress.FULFILLED,
      payload: {
        message:
          "You have confirmed your email address successfully." +
          " You may now log in.",
      },
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.SUCCEEDED,
      requestError: null,
      token: null,
      hasValidToken: null,
      loggedInUserProfile: null,
    });
  });

  test("auth/issueJWSToken/pending", () => {
    /* Arrage. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.FAILED,
      requestError: "auth-issueJWSToken-rejected",
    };
    const action: IActionIssueJWSTokenPending = {
      type: ActionTypesIssueJWSToken.PENDING,
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.LOADING,
      requestError: null,
      token: null,
      hasValidToken: null,
      loggedInUserProfile: null,
    });
  });

  test("auth/issueJWSToken/rejected", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
    };
    const action: IActionIssueJWSTokenRejected = {
      type: ActionTypesIssueJWSToken.REJECTED,
      error: "auth-issueJWSToken-rejected",
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.FAILED,
      requestError: "auth-issueJWSToken-rejected",
      token: null,
      hasValidToken: false,
      loggedInUserProfile: null,
    });
  });

  test("auth/issueJWSToken/fulfilled", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
    };
    const action: IActionIssueJWSTokenFulfilled = {
      type: ActionTypesIssueJWSToken.FULFILLED,
      payload: {
        token: "token-issued-by-the-backend",
      },
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.SUCCEEDED,
      requestError: null,
      token: "token-issued-by-the-backend",
      hasValidToken: true,
      loggedInUserProfile: null,
    });
  });

  test("auth/fetchProfile/pending", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.FAILED,
      requestError: "auth-fetchProfile-rejected",
      token: "token-that-was-loaded-from-localStorage-but-is-no-longer-valid",
    };
    const action: IActionFetchProfilePending = {
      type: ActionTypesFetchProfile.PENDING,
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.LOADING,
      requestError: null,
      token: "token-that-was-loaded-from-localStorage-but-is-no-longer-valid",
      hasValidToken: null,
      loggedInUserProfile: null,
    });
  });

  test("auth/fetchProfile/rejected", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
      token: "token-that-was-loaded-from-localStorage-but-is-no-longer-valid",
    };
    const action: IActionFetchProfileRejected = {
      type: ActionTypesFetchProfile.REJECTED,
      error: "auth-fetchProfile-rejected",
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.FAILED,
      requestError: "auth-fetchProfile-rejected",
      token: "token-that-was-loaded-from-localStorage-but-is-no-longer-valid",
      hasValidToken: false,
      loggedInUserProfile: null,
    });
  });

  test("auth/fetchProfile/fulfilled", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
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

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
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

  test("auth/requestPasswordReset/pending", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.FAILED,
      requestError: "auth-requestPasswordReset-rejected",
    };
    const action: IActionRequestPasswordResetPending = {
      type: ActionTypesRequestPasswordReset.PENDING,
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      ...initStAuth,
      requestStatus: RequestStatus.LOADING,
      requestError: null,
    });
  });

  test("auth/requestPasswordReset/rejected", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.LOADING,
    };
    const action: IActionRequestPasswordResetRejected = {
      type: ActionTypesRequestPasswordReset.REJECTED,
      error: "auth-requestPasswordReset-rejected",
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      ...initStAuth,
      requestStatus: RequestStatus.FAILED,
      requestError: "auth-requestPasswordReset-rejected",
    });
  });

  test("auth/requestPasswordReset/fulfilled", () => {
    /* Arrange. */
    initStAuth = {
      ...INITIAL_STATE_AUTH,
      requestStatus: RequestStatus.LOADING,
    };
    const action: IActionRequestPasswordResetFulfilled = {
      type: ActionTypesRequestPasswordReset.FULFILLED,
    };

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      ...initStAuth,
      requestStatus: RequestStatus.SUCCEEDED,
    });
  });

  test("auth/clearSlice", () => {
    /* Arrange. */
    initStAuth = {
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

    /* Act. */
    const newState: IStateAuth = authReducer(initStAuth, action);

    /* Assert. */
    expect(newState).toEqual({
      requestStatus: RequestStatus.SUCCEEDED,
      requestError: null,
      token: null,
      hasValidToken: false,
      loggedInUserProfile: null,
    });
  });
});

/* Create an MSW "request-interception layer". */
const requestHandlersToMock: any[] = [];

const requestInterceptionLayer: SetupServer = setupServer(
  ...requestHandlersToMock
);

const createStoreMock = configureMockStore<
  IState,
  ThunkDispatch<IState, any, AnyAction>
>([thunkMiddleware]);

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
      "createUser(username, ...)" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        /* Arrange. */
        requestInterceptionLayer.use(
          rest.post("/api/users", requestHandlers.mockCreateUser)
        );

        /* Act. */
        const createUserPromise = storeMock.dispatch(
          createUser(
            "mocked-username",
            "mocked-email@protonmail.com",
            "mocked-password"
          )
        );

        /* Assert. */
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
        /* Arrange. */
        requestInterceptionLayer.use(
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

        /* Act. */
        const createUserPromise = storeMock.dispatch(
          createUser(
            "mocked-username",
            "mocked-email@protonmail.com",
            "mocked-password"
          )
        );

        /* Assert. */
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
      "confirmEmailAddress(tokenForConfirmingEmailAddress)" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        /* Arrange. */
        requestInterceptionLayer.use(
          rest.post(
            "/api/confirm-email-address/:token_for_confirming_email_address",
            requestHandlers.mockConfirmEmailAddress
          )
        );

        /* Act. */
        const confirmEmailAddressPromise = storeMock.dispatch(
          confirmEmailAddress("mocked-token-for-confirming-email-address")
        );

        /* Assert. */
        await expect(confirmEmailAddressPromise).resolves.toEqual(undefined);
        expect(storeMock.getActions()).toEqual([
          {
            type: "auth/confirmEmailAddress/pending",
          },
          {
            type: "auth/confirmEmailAddress/fulfilled",
            payload: {
              message:
                "[mocked] You have confirmed your email address successfully." +
                " You may now log in.",
            },
          },
        ]);
      }
    );

    test(
      "confirmEmailAddress(tokenForConfirmingEmailAddress)" +
        " + the HTTP request issued by that thunk-action is mocked to fail",
      async () => {
        /* Arrange. */
        const mockSingleFailure = createMockOneOrManyFailures(
          "single failure",
          {
            statusCode: 401,
            error: "[mocked] Unauthorized,",
            message: "[mocked] The provided token is invalid.",
          }
        );
        requestInterceptionLayer.use(
          rest.post(
            "/api/confirm-email-address/:token_for_confirming_email_address",
            mockSingleFailure
          )
        );

        /* Act. */
        const confirmEmailAddressPromise = storeMock.dispatch(
          confirmEmailAddress("mocked-token-for-confirming-email-address")
        );

        /* Assert. */
        await expect(confirmEmailAddressPromise).rejects.toEqual(
          "[mocked] The provided token is invalid."
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "auth/confirmEmailAddress/pending",
          },
          {
            type: "auth/confirmEmailAddress/rejected",
            error: "[mocked] The provided token is invalid.",
          },
        ]);
      }
    );

    test(
      "issueJWSToken(email, password)" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        /* Arrane. */
        requestInterceptionLayer.use(
          rest.post("/api/tokens", requestHandlers.mockIssueJWSToken)
        );

        /* Act. */
        const issueJWSTokenPromise = storeMock.dispatch(
          issueJWSToken("mocked-email@protonmail.com", "mocked-password")
        );

        /* Assert. */
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
        /* Arrange. */
        requestInterceptionLayer.use(
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

        /* Act. */
        const issueJWSTokenPromise = storeMock.dispatch(
          issueJWSToken("mocked-email@protonmail.com", "mocked-password")
        );

        /* Assert. */
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
        /* Arrange. */
        requestInterceptionLayer.use(
          rest.get("/api/user-profile", requestHandlers.mockFetchUserProfile)
        );

        /* Act. */
        const fetchProfilePromise = storeMock.dispatch(fetchProfile());

        /* Assert. */
        await expect(fetchProfilePromise).resolves.toEqual(undefined);
        expect(storeMock.getActions()).toEqual([
          {
            type: "auth/fetchProfile/pending",
          },
          {
            type: "auth/fetchProfile/fulfilled",
            payload: {
              profile: MOCK_PROFILE,
            },
          },
        ]);
      }
    );

    test(
      "fetchProfile()" +
        " + the HTTP request issued by that thunk-action is mocked to fail",
      async () => {
        /* Arrange. */
        requestInterceptionLayer.use(
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

        /* Act. */
        const fetchProfilePromise = storeMock.dispatch(fetchProfile());

        /* Assert. */
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
      "requestPasswordReset(email)" +
        " + the HTTP request issued by that thunk-action is mocked to succeed",
      async () => {
        /* Arrange. */
        requestInterceptionLayer.use(
          rest.post(
            "/api/request-password-reset",
            requestHandlers.mockRequestPasswordReset
          )
        );

        /* Act. */
        const requestPasswordResetPromise = storeMock.dispatch(
          requestPasswordReset("mocked-email@protonmail.com")
        );

        /* Assert. */
        await expect(requestPasswordResetPromise).resolves.toEqual(undefined);
        expect(storeMock.getActions()).toEqual([
          {
            type: "auth/requestPasswordReset/pending",
          },
          {
            type: "auth/requestPasswordReset/fulfilled",
          },
        ]);
      }
    );

    test(
      "requestPasswordReset(email)" +
        " + the HTTP request issued by that thunk-action is mocked to fail",
      async () => {
        /* Arrange. */
        requestInterceptionLayer.use(
          rest.post("/api/request-password-reset", (req, res, ctx) => {
            return res(
              ctx.status(400),
              ctx.json({
                error: "[mocked] Bad Request",
                message: "[mocked] This is a bad request.",
              })
            );
          })
        );

        /* Act. */
        const requestPasswordResetPromise = storeMock.dispatch(
          requestPasswordReset("mocked-email@protonmail.com")
        );

        /* Assert. */
        await expect(requestPasswordResetPromise).rejects.toEqual(
          "[mocked] This is a bad request."
        );
        expect(storeMock.getActions()).toEqual([
          {
            type: "auth/requestPasswordReset/pending",
          },
          {
            type: "auth/requestPasswordReset/rejected",
            error: "[mocked] This is a bad request.",
          },
        ]);
      }
    );
  }
);

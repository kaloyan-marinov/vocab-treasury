import { Dispatch } from "redux";
import axios from "axios";

import { RequestStatus, IProfile, IStateAuth } from "../../types";
import { VOCAB_TREASURY_APP_TOKEN, INITIAL_STATE_AUTH } from "../../constants";

/* "auth/createUser/" action creators */
export enum ActionTypesCreateUser {
  PENDING = "auth/createUser/pending",
  REJECTED = "auth/createUser/rejected",
  FULFILLED = "auth/createUser/fulfilled",
}

export interface IActionCreateUserPending {
  type: typeof ActionTypesCreateUser.PENDING;
}

export interface IActionCreateUserRejected {
  type: typeof ActionTypesCreateUser.REJECTED;
  error: string;
}

export interface IActionCreateUserFulfilled {
  type: typeof ActionTypesCreateUser.FULFILLED;
}

export const createUserPending = (): IActionCreateUserPending => ({
  type: ActionTypesCreateUser.PENDING,
});

export const createUserRejected = (
  error: string
): IActionCreateUserRejected => ({
  type: ActionTypesCreateUser.REJECTED,
  error,
});

export const createUserFulfilled = (): IActionCreateUserFulfilled => ({
  type: ActionTypesCreateUser.FULFILLED,
});

export type ActionCreateUser =
  | IActionCreateUserPending
  | IActionCreateUserRejected
  | IActionCreateUserFulfilled;

/* "auth/createUser" thunk-action creator */
export const createUser = (
  username: string,
  email: string,
  password: string
) => {
  /*
    Create a thunk-action.
    When dispatched, it issues an HTTP request
    to the backend's endpoint for creating a new User resource.
    */

  return async (dispatch: Dispatch<ActionCreateUser>) => {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const body = {
      username,
      email,
      password,
    };

    dispatch(createUserPending());
    try {
      const response = await axios.post("/api/users", body, config);
      dispatch(createUserFulfilled());
      return Promise.resolve();
    } catch (err) {
      const responseBody = err.response.data;
      const responseBodyMessage =
        responseBody.message ||
        "ERROR NOT FROM BACKEND BUT FROM FRONTEND THUNK-ACTION";
      dispatch(createUserRejected(responseBodyMessage));
      return Promise.reject(responseBodyMessage);
    }
  };
};

/* "auth/confirmEmailAddress" action creators. */
export enum ActionTypesConfirmEmailAddress {
  PENDING = "auth/confirmEmailAddress/pending",
  REJECTED = "auth/confirmEmailAddress/rejected",
  FULFILLED = "auth/confirmEmailAddress/fulfilled",
}

export interface IActionConfirmEmailAddressPending {
  type: typeof ActionTypesConfirmEmailAddress.PENDING;
}

export interface IActionConfirmEmailAddressRejected {
  type: typeof ActionTypesConfirmEmailAddress.REJECTED;
  error: string;
}

export interface IActionConfirmEmailAddressFulfilled {
  type: typeof ActionTypesConfirmEmailAddress.FULFILLED;
  payload: {
    message: string;
  };
}

export const confirmEmailAddressPending =
  (): IActionConfirmEmailAddressPending => ({
    type: ActionTypesConfirmEmailAddress.PENDING,
  });

export const confirmEmailAddressRejected = (
  error: string
): IActionConfirmEmailAddressRejected => ({
  type: ActionTypesConfirmEmailAddress.REJECTED,
  error,
});

export const confirmEmailAddressFulfilled = (
  message: string
): IActionConfirmEmailAddressFulfilled => ({
  type: ActionTypesConfirmEmailAddress.FULFILLED,
  payload: {
    message,
  },
});

export type ActionConfirmEmailAddress =
  | IActionConfirmEmailAddressPending
  | IActionConfirmEmailAddressRejected
  | IActionConfirmEmailAddressFulfilled;

/* "auth/confirmEmailAddress" thunk-action creator */
export const confirmEmailAddress = (tokenForConfirmingEmailAddress: string) => {
  /*
  TODO: (2024/03/13, 08:25)
        fix the indentation in the following comment,
        as well as in all other comments that contain the string "Create a thunk-action."
  */
  /*
    Create a thunk-action.
    When dispatched, it issues an HTTP request
    to the backend's endpoint for confirming a (newly-created) User's email address.
    */

  return async (dispatch: Dispatch<ActionConfirmEmailAddress>) => {
    dispatch(confirmEmailAddressPending());
    try {
      const response = await axios.post(
        `/api/confirm-email-address/${tokenForConfirmingEmailAddress}`
      );
      dispatch(confirmEmailAddressFulfilled(response.data.message));
      return Promise.resolve();
    } catch (err) {
      const responseBodyMessage =
        err.response.data.message ||
        "ERROR NOT FROM BACKEND BUT FROM FRONTEND THUNK-ACTION";
      dispatch(confirmEmailAddressRejected(responseBodyMessage));
      return Promise.reject(err);
    }
  };
};

/* "auth/issueJWSToken/" action creators */
export enum ActionTypesIssueJWSToken {
  PENDING = "auth/issueJWSToken/pending",
  REJECTED = "auth/issueJWSToken/rejected",
  FULFILLED = "auth/issueJWSToken/fulfilled",
}

export interface IActionIssueJWSTokenPending {
  type: typeof ActionTypesIssueJWSToken.PENDING;
}

export interface IActionIssueJWSTokenRejected {
  type: typeof ActionTypesIssueJWSToken.REJECTED;
  error: string;
}

export interface IActionIssueJWSTokenFulfilled {
  type: typeof ActionTypesIssueJWSToken.FULFILLED;
  payload: {
    token: string;
  };
}

export const issueJWSTokenPending = (): IActionIssueJWSTokenPending => ({
  type: ActionTypesIssueJWSToken.PENDING,
});

export const issueJWSTokenRejected = (
  error: string
): IActionIssueJWSTokenRejected => ({
  type: ActionTypesIssueJWSToken.REJECTED,
  error,
});

export const issueJWSTokenFulfilled = (
  token: string
): IActionIssueJWSTokenFulfilled => ({
  type: ActionTypesIssueJWSToken.FULFILLED,
  payload: {
    token,
  },
});

export type ActionIssueJWSToken =
  | IActionIssueJWSTokenPending
  | IActionIssueJWSTokenRejected
  | IActionIssueJWSTokenFulfilled;

/* "auth/issueJWSToken" thunk-action creator */
export const issueJWSToken = (email: string, password: string) => {
  /*
    Create a thunk-action.
    When dispatched, it issues an HTTP request
    to the backend's endpoint for issuing a JSON Web Signature token.
    */

  return async (dispatch: Dispatch<ActionIssueJWSToken>) => {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: email,
        password,
      },
    };

    const body = {};

    dispatch(issueJWSTokenPending());
    try {
      const response = await axios.post("/api/tokens", body, config);
      localStorage.setItem(VOCAB_TREASURY_APP_TOKEN, response.data.token);
      dispatch(issueJWSTokenFulfilled(response.data.token));
      return Promise.resolve();
    } catch (err) {
      const responseBody = err.response.data;
      const responseBodyMessage =
        responseBody.message ||
        "ERROR NOT FROM BACKEND BUT FROM FRONTEND THUNK-ACTION";
      dispatch(issueJWSTokenRejected(responseBodyMessage));
      return Promise.reject(responseBodyMessage);
    }
  };
};

/* "auth/fetchProfile/" action creators */
export enum ActionTypesFetchProfile {
  PENDING = "auth/fetchProfile/pending",
  REJECTED = "auth/fetchProfile/rejected",
  FULFILLED = "auth/fetchProfile/fulfilled",
}

export interface IActionFetchProfilePending {
  type: typeof ActionTypesFetchProfile.PENDING;
}

export interface IActionFetchProfileRejected {
  type: typeof ActionTypesFetchProfile.REJECTED;
  error: string;
}

export interface IActionFetchProfileFulfilled {
  type: typeof ActionTypesFetchProfile.FULFILLED;
  payload: {
    profile: IProfile;
  };
}

export const fetchProfilePending = (): IActionFetchProfilePending => ({
  type: ActionTypesFetchProfile.PENDING,
});

export const fetchProfileRejected = (
  error: string
): IActionFetchProfileRejected => ({
  type: ActionTypesFetchProfile.REJECTED,
  error,
});

export const fetchProfileFulfilled = (
  profile: IProfile
): IActionFetchProfileFulfilled => ({
  type: ActionTypesFetchProfile.FULFILLED,
  payload: {
    profile,
  },
});

export type ActionFetchProfile =
  | IActionFetchProfilePending
  | IActionFetchProfileRejected
  | IActionFetchProfileFulfilled;

/* "auth/fetchProfile" thunk-action creator */
export const fetchProfile = () => {
  /*
    Create a thunk-action.
    When dispatched, it issues an HTTP request
    to the backend's endpoint for fetching the Profile of a specific User.
    */

  return async (dispatch: Dispatch<ActionFetchProfile>) => {
    const config = {
      headers: {
        Authorization:
          "Bearer " + localStorage.getItem(VOCAB_TREASURY_APP_TOKEN),
      },
    };

    dispatch(fetchProfilePending());
    try {
      const response = await axios.get("/api/user-profile", config);
      dispatch(fetchProfileFulfilled(response.data));
      return Promise.resolve();
    } catch (err) {
      const responseBody = err.response.data;
      const responseBodyMessage =
        responseBody.message ||
        "ERROR NOT FROM BACKEND BUT FROM FRONTEND THUNK-ACTION";
      dispatch(fetchProfileRejected(responseBodyMessage));
      return Promise.reject(responseBodyMessage);
    }
  };
};

/* "auth/requestPasswordReset/" action creators */
export enum ActionTypesRequestPasswordReset {
  PENDING = "auth/requestPasswordReset/pending",
  REJECTED = "auth/requestPasswordReset/rejected",
  FULFILLED = "auth/requestPasswordReset/fulfilled",
}

export interface IActionRequestPasswordResetPending {
  type: typeof ActionTypesRequestPasswordReset.PENDING;
}

export interface IActionRequestPasswordResetRejected {
  type: typeof ActionTypesRequestPasswordReset.REJECTED;
  error: string;
}

export interface IActionRequestPasswordResetFulfilled {
  type: typeof ActionTypesRequestPasswordReset.FULFILLED;
}

export const requestPasswordResetPending =
  (): IActionRequestPasswordResetPending => ({
    type: ActionTypesRequestPasswordReset.PENDING,
  });

export const requestPasswordResetRejected = (
  error: string
): IActionRequestPasswordResetRejected => ({
  type: ActionTypesRequestPasswordReset.REJECTED,
  error,
});

export const requestPasswordResetFulfilled =
  (): IActionRequestPasswordResetFulfilled => ({
    type: ActionTypesRequestPasswordReset.FULFILLED,
  });

export type ActionRequestPasswordReset =
  | IActionRequestPasswordResetPending
  | IActionRequestPasswordResetRejected
  | IActionRequestPasswordResetFulfilled;

/* "auth/requestPasswordReset" thunk-action creator */
export const requestPasswordReset = (email: string) => {
  /*
    Create a thunk-action.
    When dispatched, it issues an HTTP request
    to the backend's endpoint for requesting a password reset.
    */

  return async (dispatch: Dispatch<ActionRequestPasswordReset>) => {
    const config = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    const body = {
      email,
    };

    dispatch(requestPasswordResetPending());
    try {
      const response = await axios.post(
        "/api/request-password-reset",
        body,
        config
      );
      dispatch(requestPasswordResetFulfilled());
      return Promise.resolve();
    } catch (err) {
      const responseBody = err.response.data;
      const responseBodyMessage =
        responseBody.message ||
        "ERROR NOT FROM BACKEND BUT FROM FRONTEND THUNK-ACTION";
      dispatch(requestPasswordResetRejected(responseBodyMessage));
      return Promise.reject(responseBodyMessage);
    }
  };
};

/* "auth/clearSlice" action creator */
export const ACTION_TYPE_AUTH_CLEAR_SLICE = "auth/clearSlice";

export interface IActionAuthClearSlice {
  type: typeof ACTION_TYPE_AUTH_CLEAR_SLICE;
}

export const authClearSlice = (): IActionAuthClearSlice => ({
  type: ACTION_TYPE_AUTH_CLEAR_SLICE,
});

/* Reducer. */
export const authReducer = (
  state: IStateAuth = INITIAL_STATE_AUTH,
  action:
    | ActionCreateUser
    | ActionIssueJWSToken
    | ActionFetchProfile
    | ActionRequestPasswordReset
    | IActionAuthClearSlice
): IStateAuth => {
  switch (action.type) {
    case ActionTypesCreateUser.PENDING:
      return {
        ...state,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };

    case ActionTypesCreateUser.REJECTED:
      return {
        ...state,
        requestStatus: RequestStatus.FAILED,
        requestError: action.error,
      };

    case ActionTypesCreateUser.FULFILLED:
      return {
        ...state,
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
      };

    case ActionTypesIssueJWSToken.PENDING:
      return {
        ...state,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };

    case ActionTypesIssueJWSToken.REJECTED:
      return {
        ...state,
        requestStatus: RequestStatus.FAILED,
        requestError: action.error,
        hasValidToken: false,
      };

    case ActionTypesIssueJWSToken.FULFILLED:
      return {
        ...state,
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
        token: action.payload.token,
        // TODO: consider leaving it up only to ActionTypesFetchProfile
        //       to update the following sub-slice of the Redux state
        hasValidToken: true,
      };

    case ActionTypesFetchProfile.PENDING:
      return {
        ...state,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };

    case ActionTypesFetchProfile.REJECTED:
      return {
        ...state,
        requestStatus: RequestStatus.FAILED,
        requestError: action.error,
        hasValidToken: false,
      };

    case ActionTypesFetchProfile.FULFILLED: {
      const profile: IProfile = action.payload.profile;

      return {
        ...state,
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
        hasValidToken: true,
        loggedInUserProfile: profile,
      };
    }

    case ActionTypesRequestPasswordReset.PENDING:
      return {
        ...state,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };

    case ActionTypesRequestPasswordReset.REJECTED:
      return {
        ...state,
        requestStatus: RequestStatus.FAILED,
        requestError: action.error,
      };

    case ActionTypesRequestPasswordReset.FULFILLED:
      return {
        ...state,
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
      };

    case ACTION_TYPE_AUTH_CLEAR_SLICE:
      return {
        ...state,
        token: null,
        hasValidToken: false,
        loggedInUserProfile: null,
      };

    default:
      return state;
  }
};

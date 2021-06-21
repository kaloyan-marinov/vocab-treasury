import { composeWithDevTools } from "redux-devtools-extension";
import { applyMiddleware, Dispatch } from "redux";
import thunkMiddleware from "redux-thunk";
import { createStore } from "redux";
import axios from "axios";

import { combineReducers } from "redux";

export enum RequestStatus {
  IDLE = "idle",
  LOADING = "loading",
  FAILED = "failed",
  SUCCEEDED = "succeeded",
}

export interface IAlert {
  id: string;
  message: string;
}

// export interface IState {
//   requestStatus: RequestStatus;
//   requestError: string | null;
//   alertsIds: string[];
//   alertsEntities: { [alertId: string]: IAlert };
// }

export interface IStateAlerts {
  ids: string[];
  entities: { [id: string]: IAlert };
}

export interface IStateAuth {
  requestStatus: RequestStatus;
  requestError: string | null;
}

export interface IState {
  alerts: IStateAlerts;
  auth: IStateAuth;
}

export const initialStateAlerts: IStateAlerts = {
  ids: [],
  entities: {},
};

export const initialStateAuth: IStateAuth = {
  requestStatus: RequestStatus.IDLE,
  requestError: null,
};

export const initialState: IState = {
  alerts: initialStateAlerts,
  auth: initialStateAuth,
};

/* Selector functions. */
export const selectAlertsIds = (state: IState) => state.alerts.ids;
export const selectAlertsEntities = (state: IState) => state.alerts.entities;

/* alerts/* action creators */
export enum ActionTypesAlerts {
  CREATE = "alerts/create",
  REMOVE = "alerts/remove",
}

export interface IActionAlertsCreate {
  type: typeof ActionTypesAlerts.CREATE;
  payload: IAlert;
}

export interface IActionAlertsRemove {
  type: typeof ActionTypesAlerts.REMOVE;
  payload: {
    id: string;
  };
}

export const alertsCreate = (
  id: string,
  message: string
): IActionAlertsCreate => ({
  type: ActionTypesAlerts.CREATE,
  payload: {
    id,
    message,
  },
});

export const alertsRemove = (id: string): IActionAlertsRemove => ({
  type: ActionTypesAlerts.REMOVE,
  payload: {
    id,
  },
});

export type ActionAlerts = IActionAlertsCreate | IActionAlertsRemove;

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

/* Define slice reducers. */
export const alertsReducer = (
  state: IStateAlerts = initialStateAlerts,
  action: ActionAlerts
): IStateAlerts => {
  switch (action.type) {
    case ActionTypesAlerts.CREATE: {
      const alert: IAlert = action.payload;

      // For the sake of keeping track of mistakes,
      // the commented-out code-block below contains a mistake.
      /*
      const newState: IStateAlerts = { ...state };
      newState.ids.push(alert.id);
      newState.entities[alert.id] = alert;
      */

      // The following code-block fixes the commented-out code-block's mistake.
      const newAlertsIds: string[] = [alert.id, ...state.ids];

      const newAlertsEntities = { ...state.entities };
      newAlertsEntities[alert.id] = alert;

      return {
        ...state,
        ids: newAlertsIds,
        entities: newAlertsEntities,
      };
    }

    case ActionTypesAlerts.REMOVE: {
      const alertIdToRemove: string = action.payload.id;

      const newAlertsIds = state.ids.filter(
        (aId: string) => aId !== alertIdToRemove
      );

      const newAlertsEntities = { ...state.entities };
      delete newAlertsEntities[alertIdToRemove];

      return {
        ...state,
        ids: newAlertsIds,
        entities: newAlertsEntities,
      };
    }

    default:
      return state;
  }
};

export const authReducer = (
  state: IStateAuth = initialStateAuth,
  action: ActionCreateUser
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

    default:
      return state;
  }
};

/*
Define a root reducer function,
which serves to instantiate a single Redux store.

(In turn, that store will be responsible for keeping track of the React application's
global state.)
*/
export const rootReducer = combineReducers({
  alerts: alertsReducer,
  auth: authReducer,
});

const composedEnhancer = composeWithDevTools(
  /* Add all middleware functions, which you actually want to use, here: */
  applyMiddleware(thunkMiddleware)
  /* Add other store enhancers if any */
);

export const store = createStore(rootReducer, composedEnhancer);

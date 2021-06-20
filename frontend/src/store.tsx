import { composeWithDevTools } from "redux-devtools-extension";
import { applyMiddleware, Dispatch } from "redux";
import thunkMiddleware from "redux-thunk";
import { createStore } from "redux";
import axios from "axios";

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

export interface IState {
  requestStatus: RequestStatus;
  requestError: string | null;
  alertsIds: string[];
  alertsEntities: { [alertId: string]: IAlert };
}

export const initialState: IState = {
  requestStatus: RequestStatus.IDLE,
  requestError: null,
  alertsIds: [],
  alertsEntities: {},
};

/* Selector functions. */
export const selectAlertsIds = (state: IState) => state.alertsIds;
export const selectAlertsEntities = (state: IState) => state.alertsEntities;

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

/*
Define a root reducer function,
which serves to instantiate a single Redux store.

(In turn, that store will be responsible for keeping track of the React application's
global state.)
*/

export const rootReducer = (
  state: IState = initialState,
  action: ActionAlerts | ActionCreateUser
): IState => {
  switch (action.type) {
    case ActionTypesAlerts.CREATE: {
      const alert: IAlert = action.payload;

      // For the sake of keeping track of mistakes,
      // the commented-out code-block below contains a mistake.
      /*
      const newState: IState = { ...state };
      newState.alertsIds.push(alert.id);
      newState.alertsEntities[alert.id] = alert;
      */

      // The following code-block fixes the commented-out code-block's mistake.
      const newAlertsIds: string[] = [alert.id, ...state.alertsIds];

      const newAlertsEntities = { ...state.alertsEntities };
      newAlertsEntities[alert.id] = alert;

      return {
        ...state,
        alertsIds: newAlertsIds,
        alertsEntities: newAlertsEntities,
      };
    }

    case ActionTypesAlerts.REMOVE: {
      const alertIdToRemove: string = action.payload.id;

      const newAlertsIds = state.alertsIds.filter(
        (aId: string) => aId !== alertIdToRemove
      );

      const newAlertsEntities = { ...state.alertsEntities };
      delete newAlertsEntities[alertIdToRemove];

      return {
        ...state,
        alertsIds: newAlertsIds,
        alertsEntities: newAlertsEntities,
      };
    }

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

const composedEnhancer = composeWithDevTools(
  /* Add all middleware functions, which you actually want to use, here: */
  applyMiddleware(thunkMiddleware)
  /* Add other store enhancers if any */
);

export const store = createStore(rootReducer, composedEnhancer);

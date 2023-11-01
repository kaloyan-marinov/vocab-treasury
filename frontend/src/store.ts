import { composeWithDevTools } from "redux-devtools-extension";
import { applyMiddleware, Dispatch } from "redux";
import thunkMiddleware from "redux-thunk";
import { createStore } from "redux";

import { combineReducers } from "redux";

import { v4 as uuidv4 } from "uuid";

import { IState } from "./types";
import { VOCAB_TREASURY_APP_TOKEN } from "./constants";

import {
  alertsCreate,
  alertsReducer,
  IActionAlertsCreate,
} from "./features/alerts/alertsSlice";

import {
  authClearSlice,
  IActionAuthClearSlice,
  authReducer,
} from "./features/auth/authSlice";

import {
  examplesClearSlice,
  IActionExamplesClearSlice,
  examplesReducer,
} from "./features/examples/examplesSlice";
/*
TODO: (2023/10/31, 17:52)

      before submitting a pull request for review,
      improve the organization of the symbols in this file
*/

/* Define selector functions. */
export const selectAlertsIds = (state: IState) => state.alerts.ids;
export const selectAlertsEntities = (state: IState) => state.alerts.entities;

export const selectAuthRequestStatus = (state: IState) =>
  state.auth.requestStatus;
export const selectHasValidToken = (state: IState) => state.auth.hasValidToken;
export const selectLoggedInUserProfile = (state: IState) =>
  state.auth.loggedInUserProfile;

export const selectExamplesMeta = (state: IState) => state.examples.meta;
export const selectExamplesLinks = (state: IState) => state.examples.links;
export const selectExamplesIds = (state: IState) => state.examples.ids;
export const selectExamplesEntities = (state: IState) =>
  state.examples.entities;

/* authSlice thunk-action creator */
export const logOut = (message: string) => {
  /*
  Create a thunk-action.
  When dispatched, it logs the user out
  and creates an alert.
  */

  return (
    dispatch: Dispatch<
      IActionAuthClearSlice | IActionExamplesClearSlice | IActionAlertsCreate
    >
  ) => {
    localStorage.removeItem(VOCAB_TREASURY_APP_TOKEN);
    dispatch(authClearSlice());

    dispatch(examplesClearSlice());

    const id: string = uuidv4();
    dispatch(alertsCreate(id, message));
  };
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
  examples: examplesReducer,
});

const composedEnhancer = composeWithDevTools(
  /* Add all middleware functions, which you actually want to use, here: */
  applyMiddleware(thunkMiddleware)
  /* Add other store enhancers if any */
);

export const store = createStore(rootReducer, composedEnhancer);

export const INITIAL_STATE: IState = store.getState();
export type TEnhancer = typeof composedEnhancer;

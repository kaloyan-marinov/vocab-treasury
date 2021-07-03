import { composeWithDevTools } from "redux-devtools-extension";
import { applyMiddleware, Dispatch } from "redux";
import thunkMiddleware from "redux-thunk";
import { createStore } from "redux";
import axios from "axios";

import { combineReducers } from "redux";

import { v4 as uuidv4 } from "uuid";

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

export interface IStateAlerts {
  ids: string[];
  entities: { [id: string]: IAlert };
}

export interface IProfile {
  id: number;
  username: string;
  email: string;
}

export interface IStateAuth {
  requestStatus: RequestStatus;
  requestError: string | null;
  token: string | null;
  hasValidToken: boolean | null;
  loggedInUserProfile: IProfile | null;
}

export interface IExampleFromBackend {
  id: number;
  source_language: string;
  new_word: string;
  content: string;
  content_translation: string /* can be "" */;
}

export interface IExample {
  id: number;
  sourceLanguage: string;
  newWord: string;
  content: string;
  contentTranslation: string /* can be "" */;
}

export interface IPaginationMetaFromBackend {
  total_items: number;
  per_page: number;
  total_pages: number;
  page: number;
}

export interface IPaginationMeta {
  totalItems: number | null;
  perPage: number | null;
  totalPages: number | null;
  page: number | null;
}

export interface IPaginationLinks {
  self: string | null;
  next: string | null;
  prev: string | null;
  first: string | null;
  last: string | null;
}

export interface IStateExamples {
  requestStatus: RequestStatus;
  requestError: string | null;
  meta: IPaginationMeta;
  links: IPaginationLinks;
  ids: number[];
  entities: {
    [exampleId: string]: IExample;
  };
}

export interface IState {
  alerts: IStateAlerts;
  auth: IStateAuth;
  examples: IStateExamples;
}

export const initialStateAlerts: IStateAlerts = {
  ids: [],
  entities: {},
};

export const VOCAB_TREASURY_APP_TOKEN = "token-4-vocab-treasury";

export const initialStateAuth: IStateAuth = {
  requestStatus: RequestStatus.IDLE,
  requestError: null,
  token: localStorage.getItem(VOCAB_TREASURY_APP_TOKEN),
  hasValidToken: null,
  loggedInUserProfile: null,
};

export const initialStateExamples: IStateExamples = {
  requestStatus: RequestStatus.IDLE,
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
};

export const initialState: IState = {
  alerts: initialStateAlerts,
  auth: initialStateAuth,
  examples: initialStateExamples,
};

/* Selector functions. */
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

/* "alerts/*" action creators */
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

/* "examples/fetchExamples/" action creators */
export enum ActionTypesFetchExamples {
  PENDING = "examples/fetchExamples/pending",
  REJECTED = "examples/fetchExamples/rejected",
  FULFILLED = "examples/fetchExamples/fulfilled",
}

export interface IActionFetchExamplesPending {
  type: typeof ActionTypesFetchExamples.PENDING;
}

export interface IActionFetchExamplesRejected {
  type: typeof ActionTypesFetchExamples.REJECTED;
  error: string;
}

export interface IActionFetchExamplesFulfilled {
  type: typeof ActionTypesFetchExamples.FULFILLED;
  payload: {
    meta: IPaginationMeta;
    links: IPaginationLinks;
    items: IExample[];
  };
}

export const fetchExamplesPending = (): IActionFetchExamplesPending => ({
  type: ActionTypesFetchExamples.PENDING,
});

export const fetchExamplesRejected = (
  error: string
): IActionFetchExamplesRejected => ({
  type: ActionTypesFetchExamples.REJECTED,
  error,
});

export const fetchExamplesFulfilled = (
  metaFromBackend: IPaginationMetaFromBackend,
  links: IPaginationLinks,
  examplesFromBackend: IExampleFromBackend[]
): IActionFetchExamplesFulfilled => {
  const meta: IPaginationMeta = {
    totalItems: metaFromBackend.total_items,
    perPage: metaFromBackend.per_page,
    totalPages: metaFromBackend.total_pages,
    page: metaFromBackend.page,
  };

  const examples: IExample[] = examplesFromBackend.map(
    (e: IExampleFromBackend) => ({
      id: e.id,
      sourceLanguage: e.source_language,
      newWord: e.new_word,
      content: e.content,
      contentTranslation: e.content_translation,
    })
  );

  return {
    type: ActionTypesFetchExamples.FULFILLED,
    payload: {
      meta,
      links,
      items: examples,
    },
  };
};

export type ActionFetchExamples =
  | IActionFetchExamplesPending
  | IActionFetchExamplesRejected
  | IActionFetchExamplesFulfilled;

/* "examples/fetchExamples" thunk-action creator */
export const fetchExamples = (urlForOnePageOfExamples: string) => {
  /*
  Create a thunk-action.
  When dispatched, it issues an HTTP request
  to the backend's endpoint for fetching Example resources,
  which are associated with a specific User.
  */

  return async (dispatch: Dispatch<ActionFetchExamples>) => {
    const config = {
      headers: {
        Authorization:
          "Bearer " + localStorage.getItem(VOCAB_TREASURY_APP_TOKEN),
      },
    };

    dispatch(fetchExamplesPending());
    try {
      const response = await axios.get(urlForOnePageOfExamples, config);
      dispatch(
        fetchExamplesFulfilled(
          response.data._meta,
          response.data._links,
          response.data.items
        )
      );
      return Promise.resolve();
    } catch (err) {
      const responseBodyMessage =
        err.response.data.message ||
        "ERROR NOT FROM BACKEND BUT FROM FRONTEND THUNK-ACTION";
      dispatch(fetchExamplesRejected(responseBodyMessage));
      return Promise.reject(err);
    }
  };
};

/* "examples/createExample" action creators */
export enum ActionTypesCreateExample {
  PENDING = "examples/createExample/pending",
  REJECTED = "examples/createExample/rejected",
  FULFILLED = "examples/createExample/fulfilled",
}

export interface IActionCreateExamplePending {
  type: typeof ActionTypesCreateExample.PENDING;
}

export interface IActionCreateExampleRejected {
  type: typeof ActionTypesCreateExample.REJECTED;
  error: string;
}

export interface IActionCreateExampleFulfilled {
  type: typeof ActionTypesCreateExample.FULFILLED;
  payload: IExample;
}

export const createExamplePending = (): IActionCreateExamplePending => ({
  type: ActionTypesCreateExample.PENDING,
});

export const createExampleRejected = (
  error: string
): IActionCreateExampleRejected => ({
  type: ActionTypesCreateExample.REJECTED,
  error,
});

export const createExampleFulfilled = (
  id: number,
  sourceLanguage: string,
  newWord: string,
  content: string,
  contentTranslation: string /* can be "" */
): IActionCreateExampleFulfilled => ({
  type: ActionTypesCreateExample.FULFILLED,
  payload: {
    id,
    sourceLanguage,
    newWord,
    content,
    contentTranslation,
  },
});

export type ActionCreateExample =
  | IActionCreateExamplePending
  | IActionCreateExampleRejected
  | IActionCreateExampleFulfilled;

/* "examples/createExample" thunk-action creator */
export const createExample = (
  sourceLanguage: string | null,
  newWord: string,
  content: string,
  contentTranslation: string | null
) => {
  /*
  Create a thunk-action.
  When dispatched, it issues an HTTP request
  to the backend's endpoint for creating a new Example resource,
  which will be associated with a specific User.
  */
  return async (dispatch: Dispatch<ActionCreateExample>) => {
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer " + localStorage.getItem(VOCAB_TREASURY_APP_TOKEN),
      },
    };

    const body = {
      source_language: sourceLanguage,
      new_word: newWord,
      content,
      content_translation: contentTranslation,
    };

    dispatch(createExamplePending());
    try {
      const response = await axios.post("/api/examples", body, config);
      dispatch(
        createExampleFulfilled(
          response.data.id,
          response.data.source_language,
          response.data.new_word,
          response.data.content,
          response.data.content_translation
        )
      );
      return Promise.resolve();
    } catch (err) {
      const responseBodyMessage =
        err.response.data.message ||
        "ERROR NOT FROM BACKEND BUT FROM FRONTEND THUNK-ACTION";
      dispatch(createExampleRejected(responseBodyMessage));
      return Promise.reject(err);
    }
  };
};

/* "examples/deleteExample" action creators */
export enum ActionTypesDeleteExample {
  PENDING = "examples/deleteExample/pending",
  REJECTED = "examples/deleteExample/rejected",
  FULFILLED = "examples/deleteExample/fulfilled",
}

export interface IActionDeleteExamplePending {
  type: typeof ActionTypesDeleteExample.PENDING;
}

export interface IActionDeleteExampleRejected {
  type: typeof ActionTypesDeleteExample.REJECTED;
  error: string;
}

export interface IActionDeleteExampleFulfilled {
  type: typeof ActionTypesDeleteExample.FULFILLED;
  payload: {
    id: number;
  };
}

export const deleteExamplePending = (): IActionDeleteExamplePending => ({
  type: ActionTypesDeleteExample.PENDING,
});

export const deleteExampleRejected = (
  error: string
): IActionDeleteExampleRejected => ({
  type: ActionTypesDeleteExample.REJECTED,
  error,
});

export const deleteExampleFulfilled = (
  exampleId: number
): IActionDeleteExampleFulfilled => ({
  type: ActionTypesDeleteExample.FULFILLED,
  payload: {
    id: exampleId,
  },
});

export type ActionDeleteExample =
  | IActionDeleteExamplePending
  | IActionDeleteExampleRejected
  | IActionDeleteExampleFulfilled;

/* "examples/deleteExample" thunk-action creator */
export const deleteExample = (exampleId: number) => {
  /*
  Create a thunk-action.
  When dispatched, it issues an HTTP request
  to the backend's endpoint for deleting an existing Example resource,
  which must be associated with a specific User.
  */
  return async (dispatch: Dispatch<ActionDeleteExample>) => {
    const config = {
      headers: {
        Authorization:
          "Bearer " + localStorage.getItem(VOCAB_TREASURY_APP_TOKEN),
      },
    };

    dispatch(deleteExamplePending());
    try {
      const response = await axios.delete(`/api/examples/${exampleId}`, config);
      dispatch(deleteExampleFulfilled(exampleId));
      return Promise.resolve();
    } catch (err) {
      const responseBodyMessage =
        err.response.data.message ||
        "ERROR NOT FROM BACKEND BUT FROM FRONTEND THUNK-ACTION";
      dispatch(deleteExampleRejected(responseBodyMessage));
      return Promise.reject(err);
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

/* "examples/clearSlice" action creator */
export const ACTION_TYPE_EXAMPLES_CLEAR_SLICE = "examples/clearSlice";

export interface IActionExamplesClearSlice {
  type: typeof ACTION_TYPE_EXAMPLES_CLEAR_SLICE;
}

export const examplesClearSlice = (): IActionExamplesClearSlice => ({
  type: ACTION_TYPE_EXAMPLES_CLEAR_SLICE,
});

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
  action:
    | ActionCreateUser
    | ActionIssueJWSToken
    | ActionFetchProfile
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

export const examplesReducer = (
  state: IStateExamples = initialStateExamples,
  action:
    | ActionFetchExamples
    | ActionCreateExample
    | ActionDeleteExample
    | IActionExamplesClearSlice
): IStateExamples => {
  switch (action.type) {
    case ActionTypesFetchExamples.PENDING:
      return {
        ...state,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };

    case ActionTypesFetchExamples.REJECTED:
      return {
        ...state,
        requestStatus: RequestStatus.FAILED,
        requestError: action.error,
      };

    case ActionTypesFetchExamples.FULFILLED: {
      const meta: IPaginationMeta = action.payload.meta;
      const links: IPaginationLinks = action.payload.links;
      const examples: IExample[] = action.payload.items;

      const newIds: number[] = examples.map((e: IExample) => e.id);
      const newEntities: {
        [exampleId: string]: IExample;
      } = examples.reduce(
        (examplesObj: { [exampleId: string]: IExample }, e: IExample) => {
          examplesObj[e.id] = e;
          return examplesObj;
        },
        {}
      );

      return {
        ...state,
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
        meta,
        links,
        ids: newIds,
        entities: newEntities,
      };
    }

    case ActionTypesCreateExample.PENDING:
      return {
        ...state,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };

    case ActionTypesCreateExample.REJECTED:
      return {
        ...state,
        requestStatus: RequestStatus.FAILED,
        requestError: action.error,
      };

    case ActionTypesCreateExample.FULFILLED: {
      const newMeta: IPaginationMeta = {
        ...initialStateExamples.meta,
        totalItems:
          state.meta.totalItems !== null ? state.meta.totalItems + 1 : null,
      };
      const newLinks: IPaginationLinks = {
        ...initialStateExamples.links,
      };
      const newIds: number[] = [action.payload.id];
      const newEntities: { [exampleId: string]: IExample } = {
        [action.payload.id]: action.payload,
      };

      return {
        ...state,
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
        meta: newMeta,
        links: newLinks,
        ids: newIds,
        entities: newEntities,
      };
    }

    case ActionTypesDeleteExample.PENDING:
      return {
        ...state,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };

    case ActionTypesDeleteExample.REJECTED:
      return {
        ...state,
        requestStatus: RequestStatus.FAILED,
        requestError: action.error,
      };

    case ActionTypesDeleteExample.FULFILLED: {
      const idOfDeletedExample: number = action.payload.id;

      const newIds: number[] = state.ids.filter(
        (id: number) => id !== idOfDeletedExample
      );

      const newEntities: { [exampleId: string]: IExample } = {
        ...state.entities,
      };
      delete newEntities[idOfDeletedExample];

      return {
        ...state,
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
        ids: newIds,
        entities: newEntities,
      };
    }

    case ACTION_TYPE_EXAMPLES_CLEAR_SLICE:
      return {
        ...state,
        meta: initialStateExamples.meta,
        links: initialStateExamples.links,
        ids: [],
        entities: {},
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
  examples: examplesReducer,
});

const composedEnhancer = composeWithDevTools(
  /* Add all middleware functions, which you actually want to use, here: */
  applyMiddleware(thunkMiddleware)
  /* Add other store enhancers if any */
);

export const store = createStore(rootReducer, composedEnhancer);

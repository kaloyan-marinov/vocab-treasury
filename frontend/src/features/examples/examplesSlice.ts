import { Dispatch } from "redux";
import axios from "axios";

import {
  RequestStatus,
  IExampleFromBackend,
  IExample,
  IPaginationMetaFromBackend,
  IPaginationMeta,
  IPaginationLinks,
  IStateExamples,
} from "../../types";
import {
  INITIAL_STATE_EXAMPLES,
  VOCAB_TREASURY_APP_TOKEN,
} from "../../constants";

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

/* "examples/editExample" action creators */
export enum ActionTypesEditExample {
  PENDING = "examples/editExample/pending",
  REJECTED = "examples/editExample/rejected",
  FULFILLED = "examples/editExample/fulfilled",
}

export interface IActionEditExamplePending {
  type: typeof ActionTypesEditExample.PENDING;
}

export interface IActionEditExampleRejected {
  type: typeof ActionTypesEditExample.REJECTED;
  error: string;
}

export interface IActionEditExampleFulfilled {
  type: typeof ActionTypesEditExample.FULFILLED;
  payload: IExample;
}

export const editExamplePending = (): IActionEditExamplePending => ({
  type: ActionTypesEditExample.PENDING,
});

export const editExampleRejected = (
  error: string
): IActionEditExampleRejected => ({
  type: ActionTypesEditExample.REJECTED,
  error,
});

export type ActionEditExample =
  | IActionEditExamplePending
  | IActionEditExampleRejected
  | IActionEditExampleFulfilled;

export const editExampleFulfilled = (
  id: number,
  sourceLanguage: string,
  newWord: string,
  content: string,
  contentTranslation: string
): IActionEditExampleFulfilled => ({
  type: ActionTypesEditExample.FULFILLED,
  payload: {
    id,
    sourceLanguage,
    newWord,
    content,
    contentTranslation,
  },
});

/* "examples/editExample" thunk-action creator */
export const editExample = (
  exampleId: number,
  editedExample: {
    sourceLanguage?: string;
    newWord?: string;
    content?: string;
    contentTranslation?: string;
  }
) => {
  /*
    Create a thunk-action.
    When dispatched, it issues an HTTP request
    to the backend's endpoint for editing an existing Example resource,
    which must be associated with a specific User.
    */
  return async (dispatch: Dispatch<ActionEditExample>) => {
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization:
          "Bearer " + localStorage.getItem(VOCAB_TREASURY_APP_TOKEN),
      },
    };

    const body: {
      source_language?: string;
      new_word?: string;
      content?: string;
      content_translation?: string;
    } = {};
    if (editedExample.sourceLanguage !== null) {
      body.source_language = editedExample.sourceLanguage;
    }
    if (editedExample.newWord !== null) {
      body.new_word = editedExample.newWord;
    }
    if (editedExample.content !== null) {
      body.content = editedExample.content;
    }
    if (editedExample.contentTranslation !== null) {
      body.content_translation = editedExample.contentTranslation;
    }

    dispatch(editExamplePending());
    try {
      const response = await axios.put(
        `/api/examples/${exampleId}`,
        body,
        config
      );
      dispatch(
        editExampleFulfilled(
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
      dispatch(editExampleRejected(responseBodyMessage));
      return Promise.reject(err);
    }
  };
};

/* "examples/clearSlice" action creator */
export const ACTION_TYPE_EXAMPLES_CLEAR_SLICE = "examples/clearSlice";

export interface IActionExamplesClearSlice {
  type: typeof ACTION_TYPE_EXAMPLES_CLEAR_SLICE;
}

export const examplesClearSlice = (): IActionExamplesClearSlice => ({
  type: ACTION_TYPE_EXAMPLES_CLEAR_SLICE,
});

/* Reducer. */
export const examplesReducer = (
  state: IStateExamples = INITIAL_STATE_EXAMPLES,
  action:
    | ActionFetchExamples
    | ActionCreateExample
    | ActionDeleteExample
    | ActionEditExample
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
        ...INITIAL_STATE_EXAMPLES.meta,
        totalItems:
          state.meta.totalItems !== null ? state.meta.totalItems + 1 : null,
      };
      const newLinks: IPaginationLinks = {
        ...INITIAL_STATE_EXAMPLES.links,
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

    case ActionTypesEditExample.PENDING: {
      return {
        ...state,
        requestStatus: RequestStatus.LOADING,
        requestError: null,
      };
    }

    case ActionTypesEditExample.REJECTED: {
      return {
        ...state,
        requestStatus: RequestStatus.FAILED,
        requestError: action.error,
      };
    }

    case ActionTypesEditExample.FULFILLED: {
      const editedExample: IExample = action.payload;

      const newEntities: { [exampleId: string]: IExample } = {
        ...state.entities,
      };
      newEntities[editedExample.id] = editedExample;

      return {
        ...state,
        requestStatus: RequestStatus.SUCCEEDED,
        requestError: null,
        entities: newEntities,
      };
    }

    case ACTION_TYPE_EXAMPLES_CLEAR_SLICE:
      return {
        ...state,
        meta: INITIAL_STATE_EXAMPLES.meta,
        links: INITIAL_STATE_EXAMPLES.links,
        ids: [],
        entities: {},
      };

    default:
      return state;
  }
};

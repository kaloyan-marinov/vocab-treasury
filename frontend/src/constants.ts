import {
  IStateAlerts,
  RequestStatus,
  IStateAuth,
  IStateExamples,
} from "./types";

export const INITIAL_STATE_ALERTS: IStateAlerts = {
  ids: [],
  entities: {},
};

export const VOCAB_TREASURY_APP_TOKEN = "token-4-vocab-treasury";

export const INITIAL_STATE_AUTH: IStateAuth = {
  requestStatus: RequestStatus.IDLE,
  requestError: null,
  token: localStorage.getItem(VOCAB_TREASURY_APP_TOKEN),
  hasValidToken: null,
  loggedInUserProfile: null,
};

export const URL_FOR_FIRST_PAGE_OF_EXAMPLES: string = "/api/examples";

export const INITIAL_STATE_EXAMPLES: IStateExamples = {
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

/*
TODO: (2023/11/19, 21:54)

      resolving (v-t-i-79) will eliminate
      all usages of the quantity defined in the next statement

      so, part of the resolution of (v-t-i-79) is to remove the next statement
*/
export const NUM_ROWS_FOR_TEXTAREA: number = 3;

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
TODO: (2023/10/29, 11:52)

      before submitting a pull request for review,
      rename the following variables so that they will "read" like constants

      additional follow-up:
      consider whether those variables will be rendered unused/unnecessary
      when v-t-i-58 has been resolved
*/
export const styleForBorder = { border: "1px solid black" };

export const styleForTable = { width: "100%" };
Object.assign(styleForTable, styleForBorder);

// The source for the next definition is
// https://reactgo.com/horizontally-center-elements-css/
export const styleForCenter = { display: "flex", justifyContent: "center" };

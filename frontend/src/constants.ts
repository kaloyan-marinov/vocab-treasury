import { IStateAlerts, RequestStatus, IStateAuth } from "./types";

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

export interface IAlert {
  id: string;
  message: string;
}

export interface IStateAlerts {
  ids: string[];
  entities: { [id: string]: IAlert };
}

export enum RequestStatus {
  IDLE = "idle",
  LOADING = "loading",
  FAILED = "failed",
  SUCCEEDED = "succeeded",
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

/*
Specify all slices of the Redux state.
*/
export interface IState {
  alerts: IStateAlerts;
  auth: IStateAuth;
  examples: IStateExamples;
}

export interface IOptionsForCreatingMockHandler {
  statusCode: number;
  error: string;
  message: string;
}

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

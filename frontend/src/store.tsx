import { composeWithDevTools } from "redux-devtools-extension";
import { createStore } from "redux";

export interface IAlert {
  id: string;
  message: string;
}

export interface IState {
  alertsIds: string[];
  alertsEntities: { [alertId: string]: IAlert };
}

export const initialState: IState = {
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

/*
Define a root reducer function,
which serves to instantiate a single Redux store.

(In turn, that store will be responsible for keeping track of the React application's
global state.)
*/

export const rootReducer = (
  state: IState = initialState,
  action: ActionAlerts
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

    default:
      return state;
  }
};

const composedEnhancer = composeWithDevTools();
export const store = createStore(rootReducer, composedEnhancer);

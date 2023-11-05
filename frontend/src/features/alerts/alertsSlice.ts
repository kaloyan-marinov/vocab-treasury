import { IAlert, IStateAlerts } from "../../types";
import { INITIAL_STATE_ALERTS } from "../../constants";

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

/* Reducer. */
export const alertsReducer = (
  state: IStateAlerts = INITIAL_STATE_ALERTS,
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

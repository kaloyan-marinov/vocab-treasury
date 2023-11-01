import { IStateAlerts } from "../../types";
import { INITIAL_STATE_ALERTS } from "../../constants";
import {
  alertsCreate,
  alertsRemove,
  IActionAlertsCreate,
  IActionAlertsRemove,
  ActionTypesAlerts,
  alertsReducer,
} from "./alertsSlice";

describe("action creators", () => {
  test("alertsCreate", () => {
    const action = alertsCreate("alert-id-17", "PLEASE LOG IN.");

    expect(action).toEqual({
      type: "alerts/create",
      payload: {
        id: "alert-id-17",
        message: "PLEASE LOG IN.",
      },
    });
  });

  test("alertsRemove", () => {
    const action = alertsRemove("alert-id-17");

    expect(action).toEqual({
      type: "alerts/remove",
      payload: {
        id: "alert-id-17",
      },
    });
  });
});

describe("reducer", () => {
  let initStAlerts: IStateAlerts;

  beforeEach(() => {
    initStAlerts = {
      ...INITIAL_STATE_ALERTS,
    };
  });

  test("alerts/create", () => {
    const action: IActionAlertsCreate = {
      type: ActionTypesAlerts.CREATE,
      payload: {
        id: "alert-id-17",
        message: "PLEASE LOG IN.",
      },
    };

    const newState: IStateAlerts = alertsReducer(initStAlerts, action);

    expect(newState).toEqual({
      ids: ["alert-id-17"],
      entities: {
        "alert-id-17": {
          id: "alert-id-17",
          message: "PLEASE LOG IN.",
        },
      },
    });
  });

  test("alerts/remove", () => {
    initStAlerts = {
      ...INITIAL_STATE_ALERTS,
      ids: ["alert-id-17"],
      entities: {
        "alert-id-17": {
          id: "alert-id-17",
          message: "PLEASE LOG IN.",
        },
      },
    };
    const action: IActionAlertsRemove = {
      type: ActionTypesAlerts.REMOVE,
      payload: {
        id: "alert-id-17",
      },
    };

    const newState: IStateAlerts = alertsReducer(initStAlerts, action);

    expect(newState).toEqual({
      ids: [],
      entities: {},
    });
  });
});

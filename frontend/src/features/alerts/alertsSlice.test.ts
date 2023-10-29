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
    initStAlerts = { ...INITIAL_STATE_ALERTS };
  });

  test("alerts/create", () => {
    /*
    TODO: (2023/10/29, 10:30)

          before submitting a pull request for review,
          eliminate the duplication between
          the variable defined in the next statement
          and
          the `initStAlerts` defined in the `beforeEach`
    */
    const initState: IStateAlerts = {
      ...INITIAL_STATE_ALERTS,
    };
    const action: IActionAlertsCreate = {
      type: ActionTypesAlerts.CREATE,
      payload: {
        id: "alert-id-17",
        message: "PLEASE LOG IN.",
      },
    };

    const newState: IStateAlerts = alertsReducer(initState, action);

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
    const initState: IStateAlerts = {
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

    const newState: IStateAlerts = alertsReducer(initState, action);

    expect(newState).toEqual({
      ids: [],
      entities: {},
    });
  });
});

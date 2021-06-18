import {
  IState,
  initialState,
  ActionTypesAlerts,
  IActionAlertsCreate,
  IActionAlertsRemove,
  alertsCreate,
  alertsRemove,
  rootReducer,
} from "./store";

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

describe("rootReducer", () => {
  test("alerts/create", () => {
    const initState: IState = { ...initialState };
    const action: IActionAlertsCreate = {
      type: ActionTypesAlerts.CREATE,
      payload: {
        id: "alert-id-17",
        message: "PLEASE LOG IN.",
      },
    };

    const newState: IState = rootReducer(initState, action);

    expect(newState).toEqual({
      alertsIds: ["alert-id-17"],
      alertsEntities: {
        "alert-id-17": {
          id: "alert-id-17",
          message: "PLEASE LOG IN.",
        },
      },
    });
  });

  test("alerts/remove", () => {
    const initState: IState = {
      ...initialState,
      alertsIds: ["alert-id-17"],
      alertsEntities: {
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

    const newState: IState = rootReducer(initState, action);

    expect(newState).toEqual({
      alertsIds: [],
      alertsEntities: {},
    });
  });
});

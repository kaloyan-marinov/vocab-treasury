import React from "react";
import { Dispatch } from "redux";
import { useSelector, useDispatch } from "react-redux";

import { selectAlertsIds, selectAlertsEntities } from "../../store";
import { IActionAlertsRemove, alertsRemove } from "./alertsSlice";

export const Alerts = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Alerts>`);

  const alertsIds = useSelector(selectAlertsIds);
  const alertsEntities = useSelector(selectAlertsEntities);

  const dispatch: Dispatch<IActionAlertsRemove> = useDispatch();

  const handleClick = (
    alertId: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    dispatch(alertsRemove(alertId));
  };

  const alertsDivs = alertsIds.map((aId: string) => (
    <div key={aId} style={{ color: "red" }}>
      <button
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          handleClick(aId, e)
        }
      >
        Clear alert
      </button>
      {alertsEntities[aId].message}
    </div>
  ));

  return (
    <React.Fragment>
      {"<Alerts>"}
      {alertsDivs}
    </React.Fragment>
  );
};

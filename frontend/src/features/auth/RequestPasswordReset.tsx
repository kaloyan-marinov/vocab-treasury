import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Redirect } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { IState } from "../../types";
import { selectHasValidToken } from "../../store";
import { IActionAlertsCreate, alertsCreate } from "../alerts/alertsSlice";
import { ActionRequestPasswordReset, requestPasswordReset } from "./authSlice";

export const RequestPasswordReset = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <RequestPasswordReset>`
  );

  const [email, setEmail] = React.useState("");

  const hasValidToken: boolean | null = useSelector(selectHasValidToken);
  console.log(`    hasValidToken: ${hasValidToken}`);

  const dispatch: ThunkDispatch<
    IState,
    unknown,
    ActionRequestPasswordReset | IActionAlertsCreate
  > = useDispatch();

  if (hasValidToken === true) {
    const nextURL: string = "/home";
    console.log(
      `    hasValidToken: ${hasValidToken} > redirecting to ${nextURL} ...`
    );
    return <Redirect to={nextURL} />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("    submitting form");

    const id: string = uuidv4();
    if (email === "") {
      dispatch(alertsCreate(id, "THE FORM FIELD MUST BE FILLED OUT"));
    } else {
      try {
        await dispatch(requestPasswordReset(email));
        dispatch(
          alertsCreate(
            id,
            `PASSWORD-RESET INSTRUCTIONS WERE SUCCESSFULLY SENT TO ${email}`
          )
        );
        setEmail("");
      } catch (thunkActionError) {
        dispatch(alertsCreate(id, thunkActionError));
      }
    }
  };

  return (
    <React.Fragment>
      {"<RequestPasswordReset>"}
      <div>
        <form
          onSubmit={(e: React.MouseEvent<HTMLFormElement>) => handleSubmit(e)}
        >
          <fieldset>
            <legend>[legend-tag: RESET PASSWORD]</legend>
            <div>
              <label htmlFor="<RPR>-email" className="form-label">
                EMAIL
              </label>
              <input
                id="<RPR>-email"
                name="email"
                type="text"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
                className="form-control"
              />
            </div>
          </fieldset>
          <div>
            <input
              id="<RPR>-submit"
              name="submit"
              type="submit"
              value="REQUEST PASSWORD RESET"
              className="btn btn-dark"
            />
          </div>
        </form>
      </div>
    </React.Fragment>
  );
};

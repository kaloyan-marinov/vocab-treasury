import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Redirect, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { IState } from "../../types";
import { selectHasValidToken } from "../../store";
import {
  issueJWSToken,
  ActionIssueJWSToken,
  fetchProfile,
  ActionFetchProfile,
} from "./authSlice";
import { IActionAlertsCreate, alertsCreate } from "../alerts/alertsSlice";

export const Login = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Login>`);

  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });

  const hasValidToken: boolean | null = useSelector(selectHasValidToken);
  console.log(`    hasValidToken: ${hasValidToken}`);

  const dispatch: ThunkDispatch<
    IState,
    unknown,
    IActionAlertsCreate | ActionIssueJWSToken | ActionFetchProfile
  > = useDispatch();

  if (hasValidToken === true) {
    const nextURL: string = "/home";
    console.log(
      `    hasValidToken: ${hasValidToken} > redirecting to ${nextURL} ...`
    );
    return <Redirect to={nextURL} />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const id: string = uuidv4();
    if (formData.email === "" || formData.password === "") {
      dispatch(alertsCreate(id, "ALL FORM FIELDS MUST BE FILLED OUT"));
    } else {
      try {
        await dispatch(issueJWSToken(formData.email, formData.password));
        dispatch(alertsCreate(id, "LOGIN SUCCESSFUL"));
        await dispatch(fetchProfile());
      } catch (thunkActionError) {
        dispatch(alertsCreate(id, thunkActionError));
      }
    }
  };

  return (
    <React.Fragment>
      {"<Login>"}
      <div>
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleSubmit(e)}
        >
          <fieldset>
            <legend>[legend-tag: LOG IN]</legend>
            <div>
              <label htmlFor="<L>-email" className="form-label">
                EMAIL
              </label>
              <input
                id="<L>-email"
                name="email"
                type="text"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
                className="form-control"
              />
            </div>
            <div>
              <label htmlFor="<L>-password" className="form-label">
                PASSWORD
              </label>
              <input
                id="<L>-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
                className="form-control"
              />
            </div>
          </fieldset>
          <div>
            <input
              id="<L>-submit"
              name="submit"
              type="submit"
              value="LOG INTO MY ACCOUNT"
              className="btn btn-dark"
            />
            <small>
              <Link to="/request_password_reset" className="btn btn-dark">
                FORGOT PASSWORD?
              </Link>
            </small>
          </div>
        </form>
      </div>
      <div>
        <small>
          NEED AN ACCOUNT?{" "}
          <Link to="/register" className="btn btn-dark">
            CLICK HERE TO REGISTER
          </Link>
        </small>
      </div>
    </React.Fragment>
  );
};

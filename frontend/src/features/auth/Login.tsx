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
        // if (typeof thunkActionError === "string") {
        //   dispatch(alertsCreate(id, thunkActionError));
        // }

        // According to
        // https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#type-assertions
        // "Sometimes you will have information about the type of a value that TypeScript can’t know about."
        // So go on to follow the approach described in
        // https://bobbyhadz.com/blog/typescript-catch-clause-variable-type-annotation-must-be#using-a-type-assertion-to-solve-the-error .
        const typedThunkActionError = thunkActionError as string;

        dispatch(alertsCreate(id, typedThunkActionError));
      }
    }
  };

  return (
    <React.Fragment>
      {process.env.NODE_ENV === "development" && "<Login>"}
      <div className="mx-auto col-md-6">
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleSubmit(e)}
        >
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
          <div className="mt-2">
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
          <div className="d-grid">
            <input
              id="<L>-submit"
              name="submit"
              type="submit"
              value="LOG INTO MY ACCOUNT"
              className="btn btn-dark mt-2"
            />
          </div>
        </form>
        <hr />
        <div className="d-grid">
          <Link to="/request-password-reset" className="btn btn-dark mt-2">
            FORGOT PASSWORD?
          </Link>
        </div>
      </div>
    </React.Fragment>
  );
};

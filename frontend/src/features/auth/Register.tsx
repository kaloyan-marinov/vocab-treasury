import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Redirect, Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { IState } from "../../types";
import { selectHasValidToken } from "../../store";
import { IActionAlertsCreate, alertsCreate } from "../alerts/alertsSlice";
import { ActionCreateUser, createUser } from "./authSlice";

export const Register = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Register>`);

  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const hasValidToken: boolean | null = useSelector(selectHasValidToken);
  console.log(`    hasValidToken: ${hasValidToken}`);

  const dispatch: ThunkDispatch<
    IState,
    unknown,
    IActionAlertsCreate | ActionCreateUser
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
    if (
      formData.username === "" ||
      formData.email === "" ||
      formData.password === "" ||
      formData.confirmPassword === ""
    ) {
      dispatch(alertsCreate(id, "ALL FORM FIELDS MUST BE FILLED OUT"));
    } else if (formData.password !== formData.confirmPassword) {
      dispatch(alertsCreate(id, "THE PROVIDED PASSWORDS DON'T MATCH"));
    } else {
      try {
        await dispatch(
          createUser(formData.username, formData.email, formData.password)
        );
        dispatch(alertsCreate(id, "REGISTRATION SUCCESSFUL"));
      } catch (thunkActionError) {
        dispatch(alertsCreate(id, thunkActionError));
      }
    }
  };

  return (
    <React.Fragment>
      {"<Register>"}
      <div>
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleSubmit(e)}
        >
          <fieldset>
            <legend>[legend-tag: JOIN TODAY]</legend>
            <div>
              <label htmlFor="<R>-username" className="form-label">
                USERNAME
              </label>
              <input
                id="<R>-username"
                name="username"
                type="text"
                value={formData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
                className="form-control"
              />
            </div>
            <div>
              <label htmlFor="<R>-email" className="form-label">
                EMAIL
              </label>
              <input
                id="<R>-email"
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
              <label htmlFor="<R>-password" className="form-label">
                PASSWORD
              </label>
              <input
                id="<R>-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
                className="form-control"
              />
            </div>
            <div>
              <label htmlFor="<R>-confirmPassword" className="form-label">
                CONFIRM PASSWORD
              </label>
              <input
                id="<R>-confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
                className="form-control"
              />
            </div>
          </fieldset>
          <div>
            <input
              id="<R>-submit"
              name="submit"
              type="submit"
              value="CREATE MY ACCOUNT"
              className="btn btn-dark"
            />
          </div>
        </form>
      </div>
      <div>
        <small>
          ALREADY HAVE AN ACCOUNT?{" "}
          <Link to="/login" className="btn btn-dark">
            CLICK HERE TO LOG IN
          </Link>
        </small>
      </div>
    </React.Fragment>
  );
};

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Redirect } from "react-router-dom";
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
      {process.env.NODE_ENV === "development" && "<Register>"}
      <form
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleSubmit(e)}
        className="mx-auto col-md-6"
      >
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
        <div className="mt-2">
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
        <div className="mt-2">
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
        <div className="mt-2">
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
        <div className="d-grid">
          <input
            id="<R>-submit"
            name="submit"
            type="submit"
            value="CREATE MY ACCOUNT"
            className="btn btn-dark mt-2"
          />
        </div>
      </form>
    </React.Fragment>
  );
};

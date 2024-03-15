import { useParams, useHistory } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useSelector, useDispatch } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { Redirect } from "react-router-dom";

import { IState } from "../../types";
import { selectHasValidToken } from "../../store";
import { IActionAlertsCreate, alertsCreate } from "../alerts/alertsSlice";
import { ActionConfirmEmailAddress, confirmEmailAddress } from "./authSlice";

export const ConfirmEmailAddress = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <ConfirmEmailAddress>`
  );

  const params: { token_for_confirming_email_address: string } = useParams();
  console.log(
    `${new Date().toISOString()} - inspecting the \`params\` passed in to <ConfirmEmailAddress>`
  );
  console.log(params);
  const tokenForConfirmingEmailAddress: string =
    params.token_for_confirming_email_address;

  const hasValidToken: boolean | null = useSelector(selectHasValidToken);
  console.log(`    hasValidToken: ${hasValidToken}`);

  const history = useHistory();

  const dispatch: ThunkDispatch<
    IState,
    unknown,
    IActionAlertsCreate | ActionConfirmEmailAddress
  > = useDispatch();

  if (hasValidToken === true) {
    const nextURL: string = "/home";
    console.log(
      `    hasValidToken: ${hasValidToken} > redirecting to ${nextURL} ...`
    );
    return <Redirect to={nextURL} />;
    /*
    It is interesting to note that
    it is possible to replace the following statement with
    ```
    history.push(nextURL);
    ```
    */
  }

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    console.log("    clicking <ConfirmEmailAddress>'s button");

    const id: string = uuidv4();
    try {
      await dispatch(confirmEmailAddress(tokenForConfirmingEmailAddress));

      dispatch(
        alertsCreate(
          id,
          "EMAIL-ADDRESS CONFIRMATION SUCCESSFUL - YOU MAY NOW LOG IN."
        )
      );

      const locationDescriptor = {
        pathname: "/login",
      };
      history.push(locationDescriptor);
    } catch (thunkActionError) {
      const message =
        thunkActionError +
        " PLEASE DOUBLE-CHECK YOUR EMAIL INBOX FOR A MESSAGE" +
        " WITH INSTRUCTIONS ON HOW TO CONFIRM YOUR EMAIL ADDRESS.";
      dispatch(alertsCreate(id, message));
    }
  };

  return (
    <div className="mx-auto w-50 d-grid">
      {process.env.NODE_ENV === "development" && (
        <p>&lt; ConfirmEmailAddress &gt;</p>
      )}
      <button
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleClick(e)}
        className="btn btn-primary"
      >
        Confirm my email address
      </button>
    </div>
  );
};

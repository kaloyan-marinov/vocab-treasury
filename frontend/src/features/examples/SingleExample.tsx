import React from "react";
import { useHistory, useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

import { IExample, IState } from "../../types";
import { URL_FOR_FIRST_PAGE_OF_EXAMPLES } from "../../constants";
import {
  logOut,
  selectExamplesEntities,
  selectExamplesLinks,
} from "../../store";
import {
  fetchExamples,
  ActionDeleteExample,
  deleteExample,
} from "./examplesSlice";
import { IActionAlertsCreate, alertsCreate } from "../alerts/alertsSlice";

export const SingleExample = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <SingleExample>`
  );

  const params: { id: string } = useParams();
  console.log(
    `${new Date().toISOString()} - inspecting the \`params\` passed in to <SingleExample>`
  );
  console.log(`    ${JSON.stringify(params)}`);
  const exampleId: number = parseInt(params.id);

  const examplesEntities = useSelector(selectExamplesEntities);

  const examplesLinks = useSelector(selectExamplesLinks);

  const dispatch: ThunkDispatch<
    IState,
    unknown,
    ActionDeleteExample | IActionAlertsCreate
  > = useDispatch();

  const history = useHistory();

  const [isDeleteInProgress, setIsDeleteInProgress] = React.useState(false);

  const example: IExample = examplesEntities[exampleId];

  const locationDescriptor = {
    pathname: "/own-vocabtreasury",
    state: {
      fromSingleExample: true,
    },
  };

  const exampleTable =
    example === undefined ? null : (
      <table className="table table-bordered table-primary">
        <thead>
          <tr>
            <th>ID</th>
            <th>SOURCE LANGUAGE</th>
            <th>NEW WORD</th>
            <th>EXAMPLE</th>
            <th>TRANSLATION</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{example.id}</td>
            <td>{example.sourceLanguage}</td>
            <td>{example.newWord}</td>
            <td>{example.content}</td>
            <td>{example.contentTranslation}</td>
          </tr>
        </tbody>
      </table>
    );

  const buttonToDeleteExample = (
    <button
      onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
        setIsDeleteInProgress(true)
      }
      className="btn btn-dark"
    >
      Delete this example
    </button>
  );

  const linkToOwnVocabTreasury = (
    <Link to={locationDescriptor} className="btn btn-dark">
      Return to this example within my Own VocabTreasury
    </Link>
  );

  const linkToEditExample =
    example === undefined ? null : (
      <Link to={`/example/${example.id}/edit`} className="btn btn-dark">
        Edit this example
      </Link>
    );

  const handleClickOnYes = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    console.log("    clicking <SingleExample>'s button");

    const id: string = uuidv4();
    try {
      await dispatch(deleteExample(example.id));

      dispatch(alertsCreate(id, `EXAMPLE DELETION SUCCESSFUL`));

      if (examplesLinks.self !== null) {
        await dispatch(fetchExamples(examplesLinks.self));
      } else {
        /*
        It _should_ be impossible for this block of code to ever be executed.

        Why?

        Because this component may only be rendered
        after the user's browser has loaded the /own-vocabtreasury URL,
        which causes React
        to first render <OwnVocabTreasury>
        and to then run its effect function.
        */
        await dispatch(fetchExamples(URL_FOR_FIRST_PAGE_OF_EXAMPLES));
      }

      console.log(`    re-directing to ${locationDescriptor.pathname}`);
      history.push(locationDescriptor);
    } catch (err) {
      // The following if-else block is based on the code example at
      // https://bobbyhadz.com/blog/typescript-http-request-axios .
      if (axios.isAxiosError(err)) {
        // The following if-else block is based on the code example at
        // https://axios-http.com/docs/handling_errors .
        if (err.response) {
          console.log("error message: ", err.message);

          if (err.response.status === 401) {
            dispatch(logOut("TO CONTINUE, PLEASE LOG IN"));
          } else {
            const message: string =
              err.response.data.message ||
              "ERROR NOT FROM BACKEND BUT FROM FRONTEND THUNK-ACTION";
            dispatch(alertsCreate(id, message));
          }
        }
      } else {
        console.log("unexpected error: ", err);
        return "An unexpected error occurred";
      }
    }
  };

  const controlsForDeletingExample = (
    <>
      <span className="text-danger text-center">
        Are you sure that you want to delete this example?
      </span>
      <span className="text-danger text-center">
        (This action is non-reversible.)
      </span>
      <button
        className="btn btn-dark"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          setIsDeleteInProgress(false)
        }
      >
        No, retain example
      </button>
      <button
        className="btn btn-danger"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          handleClickOnYes(e)
        }
      >
        Yes, delete example
      </button>
    </>
  );
  return (
    <React.Fragment>
      {process.env.NODE_ENV === "development" && "<SingleExample>"}
      <div>
        You have selected the following Example from your Own VocabTreasury:
      </div>

      {exampleTable}

      <div className="mx-auto w-50 d-grid gap-2">
        {isDeleteInProgress === false ? (
          <>
            {buttonToDeleteExample}
            {linkToEditExample}
            {linkToOwnVocabTreasury}
          </>
        ) : (
          <>{controlsForDeletingExample}</>
        )}
      </div>
    </React.Fragment>
  );
};

import React from "react";
import { useHistory, useParams, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { v4 as uuidv4 } from "uuid";

import { IExample, IState } from "../../types";
import {
  URL_FOR_FIRST_PAGE_OF_EXAMPLES,
  STYLE_FOR_TABLE,
  STYLE_FOR_BORDER,
} from "../../constants";
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

  const example: IExample = examplesEntities[exampleId];

  const locationDescriptor = {
    pathname: "/own-vocabtreasury",
    state: {
      fromSingleExample: true,
    },
  };

  const exampleTable =
    example === undefined ? null : (
      <table style={STYLE_FOR_TABLE}>
        <tbody>
          <tr>
            <th style={STYLE_FOR_BORDER}>ID</th>
            <th style={STYLE_FOR_BORDER}>SOURCE LANGUAGE</th>
            <th style={STYLE_FOR_BORDER}>NEW WORD</th>
            <th style={STYLE_FOR_BORDER}>EXAMPLE</th>
            <th style={STYLE_FOR_BORDER}>TRANSLATION</th>
          </tr>
          <tr>
            <th style={STYLE_FOR_BORDER}>{example.id}</th>
            <th style={STYLE_FOR_BORDER}>{example.sourceLanguage}</th>
            <th style={STYLE_FOR_BORDER}>{example.newWord}</th>
            <th style={STYLE_FOR_BORDER}>{example.content}</th>
            <th style={STYLE_FOR_BORDER}>{example.contentTranslation}</th>
          </tr>
        </tbody>
      </table>
    );

  const linkToOwnVocabTreasury = (
    <Link to={locationDescriptor}>
      Return to this example within my Own VocabTreasury
    </Link>
  );

  const linkToEditExample =
    example === undefined ? null : (
      <div>
        <Link to={`/example/${example.id}/edit`}>Edit this example</Link>
      </div>
    );

  const handleSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
    e.preventDefault();

    console.log("    submitting <SingleExample>'s form");

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
      if (err.response.status === 401) {
        dispatch(logOut("TO CONTINUE, PLEASE LOG IN"));
      } else {
        const message: string =
          err.response.data.message ||
          "ERROR NOT FROM BACKEND BUT FROM FRONTEND THUNK-ACTION";
        dispatch(alertsCreate(id, message));
      }
    }
  };

  return (
    <React.Fragment>
      {"<SingleExample>"}
      <div>
        You have selected the following Example from your Own VocabTreasury:
      </div>

      {exampleTable}

      <br />
      <div>{linkToOwnVocabTreasury}</div>

      <br />
      {linkToEditExample}

      <br />
      <form
        onSubmit={(e: React.MouseEvent<HTMLFormElement>) => handleSubmit(e)}
      >
        <input type="submit" value="Delete this example" />
      </form>
    </React.Fragment>
  );
};

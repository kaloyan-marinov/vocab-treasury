import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, Link } from "react-router-dom";
import { ThunkDispatch } from "redux-thunk";
import { v4 as uuidv4 } from "uuid";

import {
  URL_FOR_FIRST_PAGE_OF_EXAMPLES,
  styleForBorder,
  styleForTable,
} from "../../constants";
import {
  IProfile,
  IExample,
  IPaginationMeta,
  IPaginationLinks,
} from "../../types";
import {
  IState,
  logOut,
  selectLoggedInUserProfile,
  selectExamplesIds,
  selectExamplesEntities,
  selectExamplesMeta,
  selectExamplesLinks,
} from "../../store";
import { ActionFetchExamples, fetchExamples } from "./examplesSlice";
import { IActionAlertsCreate, alertsCreate } from "../alerts/alertsSlice";

interface LocationStateWithinOwnVocabTreasury {
  fromRecordNewExample: null | boolean;
  fromSingleExample: null | boolean;
  fromEditExample: null | boolean;
}

export const OwnVocabTreasury = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <OwnVocabTreasury>`
  );

  const loggedInUserProfile: IProfile | null = useSelector(
    selectLoggedInUserProfile
  );

  const examplesMeta: IPaginationMeta = useSelector(selectExamplesMeta);
  const examplesLinks: IPaginationLinks = useSelector(selectExamplesLinks);
  const examplesIds: number[] = useSelector(selectExamplesIds);
  const examplesEntities: {
    [exampleId: string]: IExample;
  } = useSelector(selectExamplesEntities);

  const dispatch: ThunkDispatch<
    IState,
    unknown,
    ActionFetchExamples | IActionAlertsCreate
  > = useDispatch();

  let location = useLocation<LocationStateWithinOwnVocabTreasury>();
  let initialExamplesUrl: string;
  if (
    location.state &&
    location.state.fromRecordNewExample === true &&
    examplesLinks.last !== null
  ) {
    console.log("    from /example/new (i.e. <RecordNewExample>)");
    initialExamplesUrl = examplesLinks.last;
  } else if (
    location.state &&
    location.state.fromSingleExample &&
    examplesLinks.self !== null
  ) {
    /*
      Arrange for the user to be shown
      either the most-recently visited page of her Own VocabTreasury
      or the last page thereof.
      */
    console.log("    from /examples/:id (i.e. <SingleExample>)");

    if (
      examplesMeta.page !== null &&
      examplesMeta.totalPages !== null &&
      examplesMeta.page > examplesMeta.totalPages &&
      examplesLinks.last !== null
    ) {
      /*
        Handle the case, where
        (a) the most-recently visited page of the user's Own VocabTreasury used to
            the last page thereof;
        (b) that page used to contain a single example;
        and (c) the user used the frontend UI to delete that example.
        */
      initialExamplesUrl = examplesLinks.last;
    } else {
      initialExamplesUrl = examplesLinks.self;
    }
  } else if (
    location.state &&
    location.state.fromEditExample &&
    examplesLinks.self !== null
  ) {
    console.log("    from /example/:id/edit (i.e. <EditExample>)");
    initialExamplesUrl = examplesLinks.self;
  } else {
    console.log(
      "    NOT from any of the following: /example/new, /example/:id, /example/:id/edit"
    );
    initialExamplesUrl = URL_FOR_FIRST_PAGE_OF_EXAMPLES;
  }

  const [examplesUrl, setExamplesUrl] =
    React.useState<string>(initialExamplesUrl);

  React.useEffect(() => {
    console.log(
      `${new Date().toISOString()} - React is running <OwnVocabTreasury>'s useEffect hook`
    );

    const effectFn = async () => {
      console.log(
        "    <OwnVocabTreasury>'s useEffect hook is dispatching fetchExamples(examplesUrl)"
      );
      console.log("    with examplesUrl equal to:");
      console.log(`    ${examplesUrl}`);

      try {
        await dispatch(fetchExamples(examplesUrl));
      } catch (err) {
        if (err.response.status === 401) {
          dispatch(
            logOut(
              "[FROM <OwnVocabTreasury>'S useEffect HOOK] PLEASE LOG BACK IN"
            )
          );
        } else {
          const id: string = uuidv4();
          const message: string =
            err.response.data.message ||
            "ERROR NOT FROM BACKEND BUT FROM FRONTEND THUNK-ACTION";
          dispatch(alertsCreate(id, message));
        }
      }
    };

    effectFn();
  }, [dispatch, examplesUrl]);

  const exampleTableRows = examplesIds.map((eId: number) => {
    const e: IExample = examplesEntities[eId];

    return (
      <tr key={e.id}>
        <th style={styleForBorder}>
          <Link to={`/example/${e.id}`}>{e.id}</Link>
        </th>
        <th style={styleForBorder}>{e.sourceLanguage}</th>
        <th style={styleForBorder}>{e.newWord}</th>
        <th style={styleForBorder}>{e.content}</th>
        <th style={styleForBorder}>{e.contentTranslation}</th>
      </tr>
    );
  });

  let paginationControllingButtons: JSX.Element;
  if (examplesMeta.page === null) {
    console.log("    examplesMeta.page === null");

    paginationControllingButtons = (
      <div>Building pagination-controlling buttons...</div>
    );
  } else {
    console.log("    examplesMeta.page !== null");

    /*
      TODO: find out why
            this block requires the Non-null Assertion Operator (Postfix !) to be used twice,
            despite the fact this block appears to be in line with the recommendation on
            https://stackoverflow.com/a/46915314
  
            the "Non-null Assertion Operator (Postfix !)" is described on
            https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#strictnullchecks-on
      */
    const paginationCtrlBtnPrev: JSX.Element =
      examplesLinks.prev !== null ? (
        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
            setExamplesUrl(examplesLinks.prev!)
          }
        >
          Previous page
        </button>
      ) : (
        <button disabled>Previous page</button>
      );

    const paginationCtrlBtnNext: JSX.Element =
      examplesLinks.next !== null ? (
        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
            setExamplesUrl(examplesLinks.next!)
          }
        >
          Next page
        </button>
      ) : (
        <button disabled>Next page</button>
      );

    const paginationCtrlBtnFirst: JSX.Element = (
      <button
        disabled={examplesMeta.page === 1}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          setExamplesUrl(examplesLinks.first!)
        }
      >
        First page: 1
      </button>
    );

    const paginationCtrlBtnLast: JSX.Element = (
      <button
        disabled={examplesMeta.page === examplesMeta.totalPages}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          setExamplesUrl(examplesLinks.last!)
        }
      >
        Last page: {examplesMeta.totalPages}
      </button>
    );

    paginationControllingButtons = (
      <React.Fragment>
        <div>
          {paginationCtrlBtnFirst} {paginationCtrlBtnPrev}{" "}
          <span style={{ color: "red" }}>
            Current page: {examplesMeta.page}{" "}
          </span>
          {paginationCtrlBtnNext} {paginationCtrlBtnLast}{" "}
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      {"<OwnVocabTreasury>"}
      <h1>
        {loggedInUserProfile === null
          ? "Something went wrong..."
          : `${loggedInUserProfile.username}'s Own VocabTreasury`}
      </h1>
      <div>
        <Link to="/example/new">Record new example</Link>
      </div>
      <div>
        <Link to="/own-vocabtreasury/search">Search</Link>
      </div>
      <br />
      {paginationControllingButtons}
      <table style={styleForTable}>
        <tbody>
          <tr>
            <th style={styleForBorder}>ID</th>
            <th style={styleForBorder}>SOURCE LANGUAGE</th>
            <th style={styleForBorder}>NEW WORD</th>
            <th style={styleForBorder}>EXAMPLE</th>
            <th style={styleForBorder}>TRANSLATION</th>
          </tr>
          {exampleTableRows}
        </tbody>
      </table>
    </React.Fragment>
  );
};

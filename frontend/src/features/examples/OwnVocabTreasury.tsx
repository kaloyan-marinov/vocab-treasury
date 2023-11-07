import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { useLocation, Link } from "react-router-dom";
import { ThunkDispatch } from "redux-thunk";
import { v4 as uuidv4 } from "uuid";

import {
  IProfile,
  IExample,
  IPaginationMeta,
  IPaginationLinks,
  IState,
} from "../../types";
import { URL_FOR_FIRST_PAGE_OF_EXAMPLES } from "../../constants";
import {
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
        <td>
          <Link to={`/example/${e.id}`} className="btn btn-dark">
            {e.id}
          </Link>
        </td>
        <td>{e.sourceLanguage}</td>
        <td>{e.newWord}</td>
        <td>{e.content}</td>
        <td>{e.contentTranslation}</td>
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
          className="btn btn-dark"
        >
          Previous page
        </button>
      ) : (
        <button disabled className="btn btn-dark">
          Previous page
        </button>
      );

    const paginationCtrlBtnNext: JSX.Element =
      examplesLinks.next !== null ? (
        <button
          onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
            setExamplesUrl(examplesLinks.next!)
          }
          className="btn btn-dark"
        >
          Next page
        </button>
      ) : (
        <button disabled className="btn btn-dark">
          Next page
        </button>
      );

    const paginationCtrlBtnFirst: JSX.Element = (
      <button
        disabled={examplesMeta.page === 1}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          setExamplesUrl(examplesLinks.first!)
        }
        className="btn btn-dark"
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
        className="btn btn-dark"
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
        <Link to="/example/new" className="btn btn-dark">
          Record new example
        </Link>
      </div>
      <div>
        <Link to="/own-vocabtreasury/search" className="btn btn-dark">
          Search
        </Link>
      </div>
      <br />
      {paginationControllingButtons}
      <table className="table table-striped">
        <thead>
          <tr>
            <th>ID</th>
            <th>SOURCE LANGUAGE</th>
            <th>NEW WORD</th>
            <th>EXAMPLE</th>
            <th>TRANSLATION</th>
          </tr>
        </thead>
        <tbody className="table-group-divider">{exampleTableRows}</tbody>
      </table>
    </React.Fragment>
  );
};

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { ThunkDispatch } from "redux-thunk";
import { v4 as uuidv4 } from "uuid";

import {
  URL_FOR_FIRST_PAGE_OF_EXAMPLES,
  STYLE_FOR_BORDER,
  STYLE_FOR_CENTER,
} from "../../constants";
import { IExample, IState } from "../../types";
import {
  logOut,
  selectExamplesIds,
  selectExamplesEntities,
  selectExamplesMeta,
  selectExamplesLinks,
} from "../../store";
import { ActionFetchExamples, fetchExamples } from "./examplesSlice";
import { IActionAlertsCreate, alertsCreate } from "../alerts/alertsSlice";

export const Search = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Search>`);

  const [filteredExamplesUrl, setFilteredExamplesUrl] = React.useState("");

  const [formData, setFormData] = React.useState({
    newWord: "",
    content: "",
    contentTranslation: "",
  });

  const examplesMeta = useSelector(selectExamplesMeta);
  const examplesLinks = useSelector(selectExamplesLinks);
  const examplesIds = useSelector(selectExamplesIds);
  const examplesEntities = useSelector(selectExamplesEntities);

  const dispatch: ThunkDispatch<
    IState,
    unknown,
    ActionFetchExamples | IActionAlertsCreate
  > = useDispatch();

  React.useEffect(() => {
    console.log(
      `${new Date().toISOString()} - React is running <Search>'s useEffect hook`
    );

    const effectFn = async () => {
      if (filteredExamplesUrl !== "") {
        console.log(
          "    <Search>'s useEffect hook is dispatching fetchExamples(filteredExamplesUrl)"
        );
        console.log("    with filteredExamplesUrl equal to:");
        console.log(`    ${filteredExamplesUrl}`);

        try {
          await dispatch(fetchExamples(filteredExamplesUrl));
        } catch (err) {
          if (err.response.status === 401) {
            dispatch(
              logOut("[FROM <Search>'s useEffect HOOK] PLEASE LOG BACK IN")
            );
          } else {
            const id: string = uuidv4();
            const message: string =
              err.response.data.message ||
              "ERROR NOT FROM BACKEND BUT FROM FRONTEND THUNK-ACTION";
            dispatch(alertsCreate(id, message));
          }
        }
      }
    };

    effectFn();
  }, [dispatch, filteredExamplesUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.MouseEvent<HTMLFormElement>) => {
    e.preventDefault();

    const queryParams: string[] = [];
    if (formData.newWord !== "") {
      queryParams.push("new_word=" + formData.newWord);
    }
    if (formData.content !== "") {
      queryParams.push("content=" + formData.content);
    }
    if (formData.contentTranslation !== "") {
      queryParams.push("content_translation=" + formData.contentTranslation);
    }

    const queryParamString =
      queryParams.length > 0 ? "?" + queryParams.join("&") : "";
    const url = URL_FOR_FIRST_PAGE_OF_EXAMPLES + queryParamString;
    console.log("    submitting form");
    console.log(`    ${url}`);
    setFilteredExamplesUrl(url);
  };

  /*
    TODO: address/eliminate/reduce the duplication between
          the value assigned to the next variable "in the else"
          and the value assigned to the variable of the same name in <OwnVocabTreasury>
    */
  const exampleTableRows =
    filteredExamplesUrl === ""
      ? null
      : examplesIds.map((eId: number) => {
          const e: IExample = examplesEntities[eId];

          return (
            <tr key={e.id}>
              <td style={STYLE_FOR_BORDER}>
                <Link to={`/example/${e.id}`}>{e.id}</Link>
              </td>
              <td style={STYLE_FOR_BORDER}>{e.sourceLanguage}</td>
              <td style={STYLE_FOR_BORDER}>{e.newWord}</td>
              <td style={STYLE_FOR_BORDER}>{e.content}</td>
              <td style={STYLE_FOR_BORDER}>{e.contentTranslation}</td>
            </tr>
          );
        });

  /*
    TODO: address/eliminate/reduce the duplication between
          the value assigned to the next variable "in the else"
          and the value assigned to the variable of the same name in <OwnVocabTreasury>
    */
  let paginationControllingButtons: null | JSX.Element;
  if (examplesMeta.page === null) {
    paginationControllingButtons = (
      <div>Building pagination-controlling buttons...</div>
    );
  } else {
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
            setFilteredExamplesUrl(examplesLinks.prev!)
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
            setFilteredExamplesUrl(examplesLinks.next!)
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
          setFilteredExamplesUrl(examplesLinks.first!)
        }
      >
        First page: 1
      </button>
    );

    const paginationCtrlBtnLast: JSX.Element = (
      <button
        disabled={examplesMeta.page === examplesMeta.totalPages}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          setFilteredExamplesUrl(examplesLinks.last!)
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
  if (filteredExamplesUrl === "") {
    paginationControllingButtons = null;
  }

  return (
    <React.Fragment>
      {"<Search>"}
      <form
        onSubmit={(e: React.MouseEvent<HTMLFormElement>) => handleSubmit(e)}
      >
        <table className="table table-striped-columns">
          <thead>
            <tr>
              <th style={STYLE_FOR_BORDER}>
                <label htmlFor="<S>-new_word">NEW WORD</label>
              </th>
              <th style={STYLE_FOR_BORDER}>
                <label htmlFor="<S>-content">EXAMPLE</label>
              </th>
              <th style={STYLE_FOR_BORDER}>
                <label htmlFor="<S>-content_translation">TRANSLATION</label>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={STYLE_FOR_BORDER}>
                <input
                  id="<S>-new_word"
                  name="newWord"
                  type="text"
                  value={formData.newWord}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(e)
                  }
                />
              </td>
              <td style={STYLE_FOR_BORDER}>
                <input
                  id="<S>-content"
                  name="content"
                  type="text"
                  value={formData.content}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(e)
                  }
                />
              </td>
              <td style={STYLE_FOR_BORDER}>
                <input
                  id="<S>-content_translation"
                  name="contentTranslation"
                  type="text"
                  value={formData.contentTranslation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(e)
                  }
                />
              </td>
            </tr>
          </tbody>
        </table>

        <br />
        <div style={STYLE_FOR_CENTER}>
          <input id="<S>-submit" name="submit" type="submit" value="SEARCH" />
        </div>
        <br />
      </form>
      {paginationControllingButtons && (
        <React.Fragment>
          {paginationControllingButtons}
          <table className="table table-striped">
            <thead>
              <tr>
                <th style={STYLE_FOR_BORDER}>ID</th>
                <th style={STYLE_FOR_BORDER}>SOURCE LANGUAGE</th>
                <th style={STYLE_FOR_BORDER}>NEW WORD</th>
                <th style={STYLE_FOR_BORDER}>EXAMPLE</th>
                <th style={STYLE_FOR_BORDER}>TRANSLATION</th>
              </tr>
            </thead>
            <tbody>{exampleTableRows}</tbody>
          </table>
        </React.Fragment>
      )}
    </React.Fragment>
  );
};

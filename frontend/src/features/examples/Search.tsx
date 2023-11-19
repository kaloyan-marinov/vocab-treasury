import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { ThunkDispatch } from "redux-thunk";
import { v4 as uuidv4 } from "uuid";

import { URL_FOR_FIRST_PAGE_OF_EXAMPLES } from "../../constants";
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

  const searchForm = (
    <form
      onSubmit={(e: React.MouseEvent<HTMLFormElement>) => handleSubmit(e)}
      className="mx-auto col-md-6"
    >
      <div>
        <label htmlFor="<S>-new_word" className="form-label">
          NEW WORD
        </label>
        <input
          id="<S>-new_word"
          name="newWord"
          type="text"
          value={formData.newWord}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
          className="form-control"
        />
      </div>
      <div>
        <label htmlFor="<S>-content" className="form-label mt-2">
          EXAMPLE
        </label>
        <input
          id="<S>-content"
          name="content"
          type="text"
          value={formData.content}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
          className="form-control"
        />
      </div>
      <div>
        <label htmlFor="<S>-content_translation" className="form-label mt-2">
          TRANSLATION
        </label>
        <input
          id="<S>-content_translation"
          name="contentTranslation"
          type="text"
          value={formData.contentTranslation}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(e)}
          className="form-control"
        />
      </div>
      <div className="d-grid">
        <input
          id="<S>-submit"
          name="submit"
          type="submit"
          value="SEARCH"
          className="btn btn-primary mt-2"
        />
      </div>
    </form>
  );

  /*
  TODO: (2023/11/12, 14:34)
  
        address/eliminate/reduce the duplication between
        the value assigned to the next variable "in the else"
        and the value assigned to the variable of the same name in <OwnVocabTreasury>
  */
  let paginationControllingButtons: null | JSX.Element;
  if (examplesMeta.page === null) {
    paginationControllingButtons = (
      <div className="mt-2">Building pagination-controlling buttons...</div>
    );
  } else {
    /*
    TODO: (2023/11/12, 14:34)

          find out why
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
            setFilteredExamplesUrl(examplesLinks.next!)
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
          setFilteredExamplesUrl(examplesLinks.first!)
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
          setFilteredExamplesUrl(examplesLinks.last!)
        }
        className="btn btn-dark"
      >
        Last page: {examplesMeta.totalPages}
      </button>
    );

    /*
    According to
    https://getbootstrap.com/docs/5.3/utilities/spacing/#horizontal-centering ,
    the CSS styling of the following content ensures that
    the content will be centered horizontally.
    */
    paginationControllingButtons = (
      <div className="mx-auto mt-2" style={{ width: "60%" }}>
        {paginationCtrlBtnFirst} {paginationCtrlBtnPrev}
        <span className="bg-warning">Current page: {examplesMeta.page} </span>
        {paginationCtrlBtnNext} {paginationCtrlBtnLast}
      </div>
    );
  }
  if (filteredExamplesUrl === "") {
    paginationControllingButtons = null;
  }

  /*
  TODO: (2023/11/12, 14:34)
  
        address/eliminate/reduce the duplication between
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

  return (
    <React.Fragment>
      {process.env.NODE_ENV === "development" && "<Search>"}
      {searchForm}
      {paginationControllingButtons && (
        <React.Fragment>
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
      )}
    </React.Fragment>
  );
};

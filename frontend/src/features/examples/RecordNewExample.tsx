import React from "react";
import { useHistory } from "react-router-dom";
import { useDispatch } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { v4 as uuidv4 } from "uuid";

import { IState } from "../../types";
import { URL_FOR_FIRST_PAGE_OF_EXAMPLES } from "../../constants";
import { logOut } from "../../store";
import {
  ActionFetchExamples,
  fetchExamples,
  ActionCreateExample,
  createExample,
} from "./examplesSlice";
import { IActionAlertsCreate, alertsCreate } from "../alerts/alertsSlice";

export const RecordNewExample = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <RecordNewExample>`
  );

  const [formData, setFormData] = React.useState({
    sourceLanguage: "",
    newWord: "",
    content: "",
    contentTranslation: "",
  });

  const history = useHistory();

  const dispatch: ThunkDispatch<
    IState,
    unknown,
    ActionCreateExample | IActionAlertsCreate | ActionFetchExamples
  > = useDispatch();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLFormElement>) => {
    e.preventDefault();

    const id: string = uuidv4();
    if (formData.newWord === "" || formData.content === "") {
      dispatch(
        alertsCreate(
          id,
          "YOU MUST FILL OUT THE FOLLOWING FORM FIELDS: NEW WORD, EXAMPLE"
        )
      );
    } else {
      try {
        await dispatch(
          createExample(
            formData.sourceLanguage !== "" ? formData.sourceLanguage : null,
            formData.newWord,
            formData.content,
            formData.contentTranslation !== ""
              ? formData.contentTranslation
              : null
          )
        );
        dispatch(alertsCreate(id, "EXAMPLE CREATION SUCCESSFUL"));

        /*
          Force
          the contents within the "meta" and "links" sub-slices
          of the app-level state's "examples" slice
          to be updated.
          */
        await dispatch(fetchExamples(URL_FOR_FIRST_PAGE_OF_EXAMPLES));

        const locationDescriptor = {
          pathname: "/own-vocabtreasury",
          state: {
            fromRecordNewExample: true,
          },
        };
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
    }
  };

  return (
    <React.Fragment>
      {process.env.NODE_ENV === "development" && "<RecordNewExample>"}
      <form
        onSubmit={(e: React.MouseEvent<HTMLFormElement>) => handleSubmit(e)}
        className="mx-auto w-50"
      >
        <div>
          <label htmlFor="<RNE>-source_language" className="form-label">
            SOURCE LANGUAGE
          </label>
          <input
            id="<RNE>-source_language"
            name="sourceLanguage"
            type="text"
            value={formData.sourceLanguage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange(e)
            }
            className="form-control"
          />
        </div>
        <div>
          <label htmlFor="<RNE>-new_word" className="form-label mt-2">
            NEW WORD
          </label>
          <input
            id="<RNE>-new_word"
            name="newWord"
            type="text"
            value={formData.newWord}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleChange(e)
            }
            className="form-control"
          />
        </div>
        <div>
          <label htmlFor="<RNE>-content" className="form-label mt-2">
            EXAMPLE
          </label>
          <textarea
            id="<RNE>-content"
            name="content"
            value={formData.content}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleChange(e)
            }
            className="form-control"
          />
        </div>
        <div>
          <label
            htmlFor="<RNE>-content_translation"
            className="form-label mt-2"
          >
            TRANSLATION
          </label>
          <textarea
            id="<RNE>-content_translation"
            name="contentTranslation"
            value={formData.contentTranslation}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              handleChange(e)
            }
            className="form-control"
          />
        </div>
        <div className="d-grid">
          <input
            id="<RNE>-submit"
            name="submit"
            type="submit"
            value="RECORD THIS EXAMPLE"
            className="btn btn-dark mt-2"
          />
        </div>
      </form>
    </React.Fragment>
  );
};

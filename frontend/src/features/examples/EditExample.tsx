import React from "react";
import { useHistory, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ThunkDispatch } from "redux-thunk";
import { v4 as uuidv4 } from "uuid";

import { IExample } from "../../types";
import { URL_FOR_FIRST_PAGE_OF_EXAMPLES } from "../../constants";
import {
  IState,
  logOut,
  selectExamplesEntities,
  selectExamplesLinks,
} from "../../store";
import {
  ActionFetchExamples,
  fetchExamples,
  ActionEditExample,
  editExample,
} from "./examplesSlice";
import { IActionAlertsCreate, alertsCreate } from "../alerts/alertsSlice";
export const EditExample = () => {
  console.log(`${new Date().toISOString()} - React is rendering <EditExample>`);

  const params: { id: string } = useParams();
  console.log(
    `${new Date().toISOString()} - inspecting the \`params\` passed in to <EditExample>`
  );
  console.log(params);
  const exampleId: number = parseInt(params.id);

  const examplesEntities = useSelector(selectExamplesEntities);

  const example: IExample = examplesEntities[exampleId];

  const examplesLinks = useSelector(selectExamplesLinks);

  const [formData, setFormData] = React.useState({
    sourceLanguage: example.sourceLanguage,
    newWord: example.newWord,
    content: example.content,
    contentTranslation: example.contentTranslation,
  });

  const dispatch: ThunkDispatch<
    IState,
    unknown,
    ActionEditExample | IActionAlertsCreate | ActionFetchExamples
  > = useDispatch();

  const history = useHistory();

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
      console.log("    submitting <EditExample>'s form");

      try {
        const { sourceLanguage, newWord, content, contentTranslation } =
          formData;
        await dispatch(
          editExample(exampleId, {
            sourceLanguage,
            newWord,
            content,
            contentTranslation,
          })
        );

        dispatch(alertsCreate(id, "EXAMPLE EDITING SUCCESSFUL"));

        if (examplesLinks.self !== null) {
          await dispatch(fetchExamples(examplesLinks.self));
        } else {
          /*
            It _should_ be impossible for this block of code to ever be executed.
  
            Why?
  
            For the same reason as in the analogous block within <SingleExample>.
            */
          await dispatch(fetchExamples(URL_FOR_FIRST_PAGE_OF_EXAMPLES));
        }

        const locationDescriptor = {
          pathname: "/own-vocabtreasury",
          state: {
            fromEditExample: true,
          },
        };

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
    }
  };

  return (
    <React.Fragment>
      {"<EditExample>"}
      <form
        onSubmit={(e: React.MouseEvent<HTMLFormElement>) => handleSubmit(e)}
      >
        <fieldset>
          <legend>[legend-tag: EDIT EXISTING EXAMPLE]</legend>
          <div>
            <label htmlFor="<EE>-source_language">SOURCE LANGUAGE</label>
            <input
              id="<EE>-source_language"
              name="sourceLanguage"
              type="text"
              value={formData.sourceLanguage}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange(e)
              }
            />
          </div>
          <div>
            <label htmlFor="<EE>-new_word">NEW WORD</label>
            <input
              id="<EE>-new_word"
              name="newWord"
              type="text"
              value={formData.newWord}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange(e)
              }
            />
          </div>
          <div>
            <label htmlFor="<EE>-content">EXAMPLE</label>
            <textarea
              id="<EE>-content"
              name="content"
              value={formData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleChange(e)
              }
            />
          </div>
          <div>
            <label htmlFor="<EE>-content_translation">TRANSLATION</label>
            <textarea
              id="<EE>-content_translation"
              name="contentTranslation"
              value={formData.contentTranslation}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleChange(e)
              }
            />
          </div>
          <div>
            <input
              id="<EE>-submit"
              name="submit"
              type="submit"
              value="EDIT THIS EXAMPLE"
            />
          </div>
        </fieldset>
      </form>
    </React.Fragment>
  );
};
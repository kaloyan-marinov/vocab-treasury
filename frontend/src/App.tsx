import { Dispatch } from "redux";
import React from "react";
import {
  Switch,
  Route,
  Link,
  useParams,
  useHistory,
  useLocation,
} from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";

import { Alerts } from "./features/alerts/Alerts";
import {
  IActionAlertsCreate,
  alertsCreate,
} from "./features/alerts/alertsSlice";

import { Register } from "./features/auth/Register";
import { Login } from "./features/auth/Login";
import { RequestPasswordReset } from "./features/auth/RequestPasswordReset";
import { fetchProfile } from "./features/auth/authSlice";

import { IProfile } from "./types";

import { PrivateRoute } from "./features/auth/PrivateRoute";

import {
  IState,
  logOut,
  selectHasValidToken,
  selectLoggedInUserProfile,
  IExample,
  selectExamplesIds,
  selectExamplesEntities,
  ActionFetchExamples,
  fetchExamples,
  IPaginationMeta,
  selectExamplesMeta,
  IPaginationLinks,
  selectExamplesLinks,
  ActionCreateExample,
  createExample,
  deleteExample,
  ActionDeleteExample,
  ActionEditExample,
  editExample,
} from "./store";
import { ThunkDispatch } from "redux-thunk";

import { Redirect } from "react-router-dom";

export const App = () => {
  console.log(`${new Date().toISOString()} - React is rendering <App>`);

  const dispatch = useDispatch();

  React.useEffect(() => {
    console.log(
      `${new Date().toISOString()} - React is running <App>'s useEffect hook`
    );

    const effectFn = async () => {
      console.log("    <App>'s useEffect hook is dispatching fetchProfile()");

      try {
        await dispatch(fetchProfile());
      } catch (err) {
        dispatch(logOut("TO CONTINUE, PLEASE LOG IN"));
      }
    };

    effectFn();
  }, [dispatch]);

  return (
    <React.Fragment>
      {"<App>"}
      <hr />
      <NavigationBar />
      <hr />
      <Alerts />
      <hr />
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
        <Route exact path="/home">
          <Home />
        </Route>
        <Route exact path="/about">
          <About />
        </Route>
        <Route exact path="/register">
          <Register />
        </Route>
        <Route exact path="/login">
          <Login />
        </Route>
        <Route exact path="/request_password_reset">
          <RequestPasswordReset />
        </Route>
        <PrivateRoute exact path="/account">
          <Account />
        </PrivateRoute>
        <PrivateRoute exact path="/own-vocabtreasury">
          <OwnVocabTreasury />
        </PrivateRoute>
        <PrivateRoute exact path="/example/new">
          <RecordNewExample />
        </PrivateRoute>
        <PrivateRoute exact path="/example/:id">
          <SingleExample />
        </PrivateRoute>
        <PrivateRoute exact path="/example/:id/edit">
          <EditExample />
        </PrivateRoute>
        <PrivateRoute exact path="/own-vocabtreasury/search">
          <Search />
        </PrivateRoute>
      </Switch>
    </React.Fragment>
  );
};

export const NavigationBar = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <NavigationBar>`
  );

  const hasValidToken: boolean | null = useSelector(selectHasValidToken);
  console.log(`    hasValidToken: ${hasValidToken}`);

  const dispatch = useDispatch();

  const alwaysVisibleLinks = (
    <React.Fragment>
      <div>
        <Link to="/">VocabTreasury</Link>
      </div>
      <div>
        <Link to="/home">Home</Link> <Link to="/about">About</Link>
      </div>
    </React.Fragment>
  );

  const guestUserLinks = (
    <div>
      <Link to="/login">Log in</Link> <Link to="/register">Register</Link>
    </div>
  );

  const loggedInUserLinks = (
    <div>
      <Link to="/own-vocabtreasury">Own VocabTreasury</Link>{" "}
      <Link to="/account">Account</Link>{" "}
      <a href="#!" onClick={() => dispatch(logOut("LOGOUT SUCCESSFUL"))}>
        Log out
      </a>
    </div>
  );

  return (
    <React.Fragment>
      {"<NavigationBar>"}
      {alwaysVisibleLinks}
      {!hasValidToken ? guestUserLinks : loggedInUserLinks}
    </React.Fragment>
  );
};

export const Home = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Home>`);

  return (
    <React.Fragment>
      {"<Home>"}
      <div>
        <h1>Welcome to VocabTreasury!</h1>
      </div>
    </React.Fragment>
  );
};

export const About = () => {
  console.log(`${new Date().toISOString()} - React is rendering <About>`);

  return (
    <React.Fragment>
      {"<About>"}
      <h1>About VocabTreasury...</h1>
    </React.Fragment>
  );
};

export const Account = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Account>`);

  const loggedInUserProfile: IProfile | null = useSelector(
    selectLoggedInUserProfile
  );

  const accountDetails: null | JSX.Element =
    loggedInUserProfile === null ? null : (
      <table style={styleForTable}>
        <thead>
          <tr>
            <th style={styleForBorder}>KEY</th>
            <th style={styleForBorder}>VALUE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={styleForBorder}>ID</td>
            <td style={styleForBorder}>{loggedInUserProfile.id}</td>
          </tr>
          <tr>
            <td style={styleForBorder}>USERNAME</td>
            <td style={styleForBorder}>{loggedInUserProfile.username}</td>
          </tr>
          <tr>
            <td style={styleForBorder}>EMAIL</td>
            <td style={styleForBorder}>{loggedInUserProfile.email}</td>
          </tr>
        </tbody>
      </table>
    );

  return (
    <React.Fragment>
      {"<Account>"}
      {accountDetails}
    </React.Fragment>
  );
};

const styleForBorder = { border: "1px solid black" };

const styleForTable = { width: "100%" };
Object.assign(styleForTable, styleForBorder);

const URL_FOR_FIRST_PAGE_OF_EXAMPLES: string = "/api/examples";

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
      {"<RecordNewExample>"}
      <div>
        <form
          onSubmit={(e: React.MouseEvent<HTMLFormElement>) => handleSubmit(e)}
        >
          <fieldset>
            <legend>[legend-tag: CREATE NEW EXAMPLE]</legend>
            <div>
              <label htmlFor="<RNE>-source_language">SOURCE LANGUAGE</label>
              <input
                id="<RNE>-source_language"
                name="sourceLanguage"
                type="text"
                value={formData.sourceLanguage}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
            <div>
              <label htmlFor="<RNE>-new_word">NEW WORD</label>
              <input
                id="<RNE>-new_word"
                name="newWord"
                type="text"
                value={formData.newWord}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
            <div>
              <label htmlFor="<RNE>-content">EXAMPLE</label>
              <textarea
                id="<RNE>-content"
                name="content"
                value={formData.content}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleChange(e)
                }
              />
            </div>
            <div>
              <label htmlFor="<RNE>-content_translation">TRANSLATION</label>
              <textarea
                id="<RNE>-content_translation"
                name="contentTranslation"
                value={formData.contentTranslation}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleChange(e)
                }
              />
            </div>
            <div>
              <input
                id="<RNE>-submit"
                name="submit"
                type="submit"
                value="RECORD THIS EXAMPLE"
              />
            </div>
          </fieldset>
        </form>
      </div>
    </React.Fragment>
  );
};

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
      <table style={styleForTable}>
        <tbody>
          <tr>
            <th style={styleForBorder}>ID</th>
            <th style={styleForBorder}>SOURCE LANGUAGE</th>
            <th style={styleForBorder}>NEW WORD</th>
            <th style={styleForBorder}>EXAMPLE</th>
            <th style={styleForBorder}>TRANSLATION</th>
          </tr>
          <tr>
            <th style={styleForBorder}>{example.id}</th>
            <th style={styleForBorder}>{example.sourceLanguage}</th>
            <th style={styleForBorder}>{example.newWord}</th>
            <th style={styleForBorder}>{example.content}</th>
            <th style={styleForBorder}>{example.contentTranslation}</th>
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

// The source for the next definition is
// https://reactgo.com/horizontally-center-elements-css/
const styleForCenter = { display: "flex", justifyContent: "center" };

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
        <table style={styleForTable}>
          <tbody>
            <tr>
              <th style={styleForBorder}>
                <label htmlFor="<S>-new_word">NEW WORD</label>
              </th>
              <th style={styleForBorder}>
                <label htmlFor="<S>-content">EXAMPLE</label>
              </th>
              <th style={styleForBorder}>
                <label htmlFor="<S>-content_translation">TRANSLATION</label>
              </th>
            </tr>
            <tr>
              <th style={styleForBorder}>
                <input
                  id="<S>-new_word"
                  name="newWord"
                  type="text"
                  value={formData.newWord}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(e)
                  }
                />
              </th>
              <th style={styleForBorder}>
                <input
                  id="<S>-content"
                  name="content"
                  type="text"
                  value={formData.content}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(e)
                  }
                />
              </th>
              <th style={styleForBorder}>
                <input
                  id="<S>-content_translation"
                  name="contentTranslation"
                  type="text"
                  value={formData.contentTranslation}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(e)
                  }
                />
              </th>
            </tr>
          </tbody>
        </table>

        <br />
        <div style={styleForCenter}>
          <input id="<S>-submit" name="submit" type="submit" value="SEARCH" />
        </div>
        <br />
      </form>
      {paginationControllingButtons && (
        <React.Fragment>
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
      )}
    </React.Fragment>
  );
};

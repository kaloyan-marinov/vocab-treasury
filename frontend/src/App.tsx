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

import {
  IState,
  selectAlertsIds,
  selectAlertsEntities,
  IActionAlertsCreate,
  IActionAlertsRemove,
  alertsCreate,
  alertsRemove,
  ActionCreateUser,
  createUser,
  ActionIssueJWSToken,
  issueJWSToken,
  ActionFetchProfile,
  fetchProfile,
  logOut,
  selectHasValidToken,
  RequestStatus,
  selectAuthRequestStatus,
  IProfile,
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
        <Route exact path="/reset_password">
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

export const Alerts = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Alerts>`);

  const alertsIds = useSelector(selectAlertsIds);
  const alertsEntities = useSelector(selectAlertsEntities);

  const dispatch: Dispatch<IActionAlertsRemove> = useDispatch();

  const handleClick = (
    alertId: string,
    e: React.MouseEvent<HTMLButtonElement>
  ) => {
    dispatch(alertsRemove(alertId));
  };

  const alertsDivs = alertsIds.map((aId: string) => (
    <div key={aId} style={{ color: "red" }}>
      <button
        onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
          handleClick(aId, e)
        }
      >
        Clear alert
      </button>
      {alertsEntities[aId].message}
    </div>
  ));

  return (
    <React.Fragment>
      {"<Alerts>"}
      {alertsDivs}
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

export const Register = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Register>`);

  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const hasValidToken: boolean | null = useSelector(selectHasValidToken);
  console.log(`    hasValidToken: ${hasValidToken}`);

  const dispatch: ThunkDispatch<
    IState,
    unknown,
    IActionAlertsCreate | ActionCreateUser
  > = useDispatch();

  if (hasValidToken === true) {
    const nextURL: string = "/home";
    console.log(
      `    hasValidToken: ${hasValidToken} > redirecting to ${nextURL} ...`
    );
    return <Redirect to={nextURL} />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const id: string = uuidv4();
    if (
      formData.username === "" ||
      formData.email === "" ||
      formData.password === "" ||
      formData.confirmPassword === ""
    ) {
      dispatch(alertsCreate(id, "ALL FORM FIELDS MUST BE FILLED OUT"));
    } else if (formData.password !== formData.confirmPassword) {
      dispatch(alertsCreate(id, "THE PROVIDED PASSWORDS DON'T MATCH"));
    } else {
      try {
        await dispatch(
          createUser(formData.username, formData.email, formData.password)
        );
        dispatch(alertsCreate(id, "REGISTRATION SUCCESSFUL"));
      } catch (thunkActionError) {
        dispatch(alertsCreate(id, thunkActionError));
      }
    }
  };

  return (
    <React.Fragment>
      {"<Register>"}
      <div>
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleSubmit(e)}
        >
          <fieldset>
            <legend>[legend-tag: JOIN TODAY]</legend>
            <div>
              <label htmlFor="<R>-username">USERNAME</label>
              <input
                id="<R>-username"
                name="username"
                type="text"
                value={formData.username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
            <div>
              <label htmlFor="<R>-email">EMAIL</label>
              <input
                id="<R>-email"
                name="email"
                type="text"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
            <div>
              <label htmlFor="<R>-password">PASSWORD</label>
              <input
                id="<R>-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
            <div>
              <label htmlFor="<R>-confirmPassword">CONFIRM PASSWORD</label>
              <input
                id="<R>-confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
          </fieldset>
          <div>
            <input
              id="<R>-submit"
              name="submit"
              type="submit"
              value="CREATE MY ACCOUNT"
            />
          </div>
        </form>
      </div>
      <div>
        <small>
          ALREADY HAVE AN ACCOUNT? <Link to="/login">CLICK HERE TO LOG IN</Link>
        </small>
      </div>
    </React.Fragment>
  );
};

export const Login = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Login>`);

  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });

  const hasValidToken: boolean | null = useSelector(selectHasValidToken);
  console.log(`    hasValidToken: ${hasValidToken}`);

  const dispatch: ThunkDispatch<
    IState,
    unknown,
    IActionAlertsCreate | ActionIssueJWSToken | ActionFetchProfile
  > = useDispatch();

  if (hasValidToken === true) {
    const nextURL: string = "/home";
    console.log(
      `    hasValidToken: ${hasValidToken} > redirecting to ${nextURL} ...`
    );
    return <Redirect to={nextURL} />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const id: string = uuidv4();
    if (formData.email === "" || formData.password === "") {
      dispatch(alertsCreate(id, "ALL FORM FIELDS MUST BE FILLED OUT"));
    } else {
      try {
        await dispatch(issueJWSToken(formData.email, formData.password));
        dispatch(alertsCreate(id, "LOGIN SUCCESSFUL"));
        await dispatch(fetchProfile());
      } catch (thunkActionError) {
        dispatch(alertsCreate(id, thunkActionError));
      }
    }
  };

  return (
    <React.Fragment>
      {"<Login>"}
      <div>
        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleSubmit(e)}
        >
          <fieldset>
            <legend>[legend-tag: LOG IN]</legend>
            <div>
              <label htmlFor="<L>-email">EMAIL</label>
              <input
                id="<L>-email"
                name="email"
                type="text"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
            <div>
              <label htmlFor="<L>-password">PASSWORD</label>
              <input
                id="<L>-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
          </fieldset>
          <div>
            <input
              id="<L>-submit"
              name="submit"
              type="submit"
              value="LOG INTO MY ACCOUNT"
            />
            <small>
              <Link to="/reset_password">FORGOT PASSWORD?</Link>
            </small>
          </div>
        </form>
      </div>
      <div>
        <small>
          NEED AN ACCOUNT? <Link to="/register">CLICK HERE TO REGISTER</Link>
        </small>
      </div>
    </React.Fragment>
  );
};

export const PrivateRoute = (props: any) => {
  console.log(
    `${new Date().toISOString()} - React is rendering <PrivateRoute>`
  );

  console.log("    its children are as follows:");
  const childrenCount: number = React.Children.count(props.children);
  React.Children.forEach(props.children, (child, ind) => {
    console.log(
      `    child #${ind + 1} (out of ${childrenCount}): <${child.type.name}>`
    );
  });

  const { children, ...rest } = props;

  const authRequestStatus: RequestStatus = useSelector(selectAuthRequestStatus);
  console.log(`    authRequestStatus: ${authRequestStatus}`);

  const hasValidToken: boolean | null = useSelector(selectHasValidToken);
  console.log(`    hasValidToken: ${hasValidToken}`);

  if (authRequestStatus === RequestStatus.LOADING) {
    console.log(`    authRequestStatus: ${RequestStatus.LOADING}`);
    return React.Children.map(props.children, (child) => (
      <div>{`<${child.type.name}>`} - Loading...</div>
    ));
  } else if (!hasValidToken) {
    const nextURL: string = "/login";
    console.log(
      `    hasValidToken: ${hasValidToken} > redirecting to ${nextURL} ...`
    );
    return <Redirect to={nextURL} />;
  } else {
    console.log(
      `    hasValidToken: ${hasValidToken} > rendering the above-listed children`
    );
    return <Route {...rest}>{children}</Route>;
  }
};

export const RequestPasswordReset = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <RequestPasswordReset>`
  );

  const [email, setEmail] = React.useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <React.Fragment>
      {"<RequestPasswordReset>"}
      <div>
        <form method="POST" action="">
          <fieldset>
            <legend>[legend-tag: RESET PASSWORD]</legend>
            <div>
              <label htmlFor="<RPR>-email">EMAIL</label>
              <input
                id="<RPR>-email"
                name="email"
                type="text"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
          </fieldset>
          <div>
            <input
              id="<RPR>-submit"
              name="submit"
              type="submit"
              value="REQUEST PASSWORD RESET"
            />
          </div>
        </form>
      </div>
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
      {paginationControllingButtons}
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

  const [formData, setFormData] = React.useState({
    newWord: "",
    content: "",
    contentTranslation: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <React.Fragment>
      {"<Search>"}
      <form method="POST" action="">
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
              <th style={styleForBorder}></th>
              <th style={styleForBorder}></th>
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
    </React.Fragment>
  );
};

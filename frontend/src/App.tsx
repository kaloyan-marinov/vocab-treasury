import { Dispatch } from "redux";
import React from "react";
import { Switch, Route, Link, useParams } from "react-router-dom";
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
        <Route exact path="/account">
          <Account />
        </Route>
        <Route exact path="/own-vocabtreasury">
          <OwnVocabTreasury />
        </Route>
        <Route exact path="/example/new">
          <RecordNewExample />
        </Route>
        <Route exact path="/example/:id">
          <SingleExample />
        </Route>
        <Route exact path="/example/:id/edit">
          <EditExample />
        </Route>
        <Route exact path="/own-vocabtreasury/search">
          <Search />
        </Route>
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

  const usernameOfLoggedInUser = "jd";

  return (
    <React.Fragment>
      {"<Account>"}
      <h1>{usernameOfLoggedInUser}</h1>
    </React.Fragment>
  );
};

const styleForBorder = { border: "1px solid black" };

const styleForTable = { width: "100%" };
Object.assign(styleForTable, styleForBorder);

interface IExample {
  id: number;
  source_language: string;
  new_word: string;
  content: string;
  content_translation: string;
}

const examplesMock: IExample[] = [
  {
    id: 1,
    source_language: "Finnish",
    new_word: "vihata + P",
    content: "Älä vihaa ketään!",
    content_translation: "Don't hate anyone!",
  },
  {
    id: 2,
    source_language: "Finnish",
    new_word: "tulinen",
    content: `"tulinen" ja "tulivuori" ovat samanlaisia sanoja.`,
    content_translation: `"spicy" and "volcano" are similar words.`,
  },
  {
    id: 3,
    source_language: "German",
    new_word: "der Termin",
    content: "Man muss erstens den Termin festsetzen und dann ihn einhalten.",
    content_translation:
      "One must firstly fix the deadline and then meet/observe it.",
  },
  {
    id: 4,
    source_language: "Finnish",
    new_word: "sama",
    content: "Olemme samaa mieltä.",
    content_translation: "I agree.",
  },
  {
    id: 5,
    source_language: "Finnish",
    new_word: "pitää",
    content: "Pidätkö koirista?",
    content_translation: "Do you like dogs?",
  },
  {
    id: 6,
    source_language: "Finnish",
    new_word: "tykätä",
    content: "Tykkäätkö koirista?",
    content_translation: "Do you like dogs?",
  },
  {
    id: 7,
    source_language: "Finnish",
    new_word: "kannettava tietokone",
    content: "Ota sinun kannettava tietokone kotiin!",
    content_translation: "Ota sinun kannettava tietokone kotiin!",
  },
  {
    id: 10,
    source_language: "Finnish",
    new_word: "teeskennellä",
    content: "Älä teeskentele, että olet sairas!",
    content_translation: "Don't pretend that you're sick!",
  },
  {
    id: 11,
    source_language: "Finnish",
    new_word: "teeskennellä",
    content: "Älä teeskentele olevasi sairas!",
    content_translation: "Don't pretend that you're sick!",
  },
  {
    id: 12,
    source_language: "Finnish",
    new_word: "teeskennellä",
    content: "Miksi teeskentelimme pitävänsä hänen vitsistään?",
    content_translation: "Why did we pretend to like his jokes?",
  },
];

const examplesMockEntities: { [exampleId: string]: IExample } =
  examplesMock.reduce(
    (examplesObj: { [exampleId: string]: IExample }, e: IExample) => {
      examplesObj[e.id] = e;
      return examplesObj;
    },
    {}
  );

export const OwnVocabTreasury = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <OwnVocabTreasury>`
  );

  const emailOfLoggedInUser = "john.doe@protonmail.com";

  const styleForLinkToCurrentPage = { fontSize: 40 };

  const exampleTableRows = Object.keys(examplesMockEntities).map(
    (exampleIdStr: string) => {
      const e: IExample = examplesMockEntities[exampleIdStr];

      return (
        <tr key={e.id}>
          <th style={styleForBorder}>
            <Link to={`/example/${e.id}?page=1`}>{e.id}</Link>
          </th>
          <th style={styleForBorder}>{e.source_language}</th>
          <th style={styleForBorder}>{e.new_word}</th>
          <th style={styleForBorder}>{e.content}</th>
          <th style={styleForBorder}>{e.content_translation}</th>
        </tr>
      );
    }
  );

  return (
    <React.Fragment>
      {"<OwnVocabTreasury>"}
      <h1>Own VocabTreasury for {emailOfLoggedInUser}</h1>
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
      {/* <font size="14"> */}
      {/* 
                https://stackoverflow.com/questions/61002821/font-with-typescript-property-font-does-not-exist-on-type-jsx-intrinsicele
                
                `<font>`` is a deprecated tag in HTML,
                so TS will not include it in its type definitions.
                This, as well as many other tags, have been deprecated
                in favor of using CSS to style elements. */}
      <Link style={styleForLinkToCurrentPage} to="/own-vocabtreasury?page=1">
        1
      </Link>{" "}
      {/* </font> */}
      <Link to="/own-vocabtreasury?page=2">2</Link> ...{" "}
      <Link to="/own-vocabtreasury?page=281">281</Link>
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <React.Fragment>
      {"<RecordNewExample>"}
      <div>
        <form method="POST" action="">
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
  console.log(params);
  const exampleId: number = parseInt(params.id);

  const example: IExample = examplesMockEntities[exampleId];

  return (
    <React.Fragment>
      {"<SingleExample>"}
      <div>
        You have selected the following Example from your Own VocabTreasury:
      </div>

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
            <th style={styleForBorder}>{example.source_language}</th>
            <th style={styleForBorder}>{example.new_word}</th>
            <th style={styleForBorder}>{example.content}</th>
            <th style={styleForBorder}>{example.content_translation}</th>
          </tr>
        </tbody>
      </table>

      <br />
      <div>
        <Link to="/own-vocabtreasury?page=1">
          Return to this example within my Own VocabTreasury
        </Link>
      </div>

      <br />
      <div>
        <Link to={`/example/${example.id}/edit?page=1`}>Edit this example</Link>
      </div>

      <br />
      <form action="/example/4/delete?page=1" method="POST">
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
  const example: IExample = examplesMockEntities[exampleId];

  const [formData, setFormData] = React.useState({
    sourceLanguage: example.source_language,
    newWord: example.new_word,
    content: example.content,
    contentTranslation: example.content_translation,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    console.log(
      `running the function,` +
        ` which handles the 'onchange' event for \`${e.target.outerHTML}\``
    );
  };

  return (
    <React.Fragment>
      {"<EditExample>"}
      <form method="POST" action="">
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
              value="RECORD THIS EXAMPLE"
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

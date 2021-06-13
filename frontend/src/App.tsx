import React from "react";
import { Switch, Route, Link } from "react-router-dom";

export const App = () => {
  console.log(`${new Date().toISOString()} - React is rendering <App>`);

  return (
    <React.Fragment>
      {"<App>"}
      <hr />
      <NavigationBar />
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
      <Link to="/account">Account</Link> <Link to="/logout">Log out</Link>
    </div>
  );

  return (
    <React.Fragment>
      {"<NavigationBar>"}
      {alwaysVisibleLinks}
      {guestUserLinks}
      {loggedInUserLinks}
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(
      `running the function,` +
        ` which handles the 'onchange' event for \`${e.target.outerHTML}\``
    );
  };

  return (
    <React.Fragment>
      {"<Register>"}
      <div>
        <form method="POST" action="">
          {/* <input
            id="csrf_token"
            name="csrf_token"
            type="hidden"
            value="IjIxMjA5YjJiMDc4NTJmMGE4Y2NmYTg5MTRiZjQyZWMzMTllNTk5MGEi.YMBIog.Sx3_eThYVwEW83gYvO9LMaNY3VU"
          /> */}
          <fieldset>
            <legend>[legend-tag: JOIN TODAY]</legend>
            <div>
              <label htmlFor="<R>-username">USERNAME</label>

              <input
                id="<R>-username"
                name="username"
                // required
                type="text"
                value=""
                // data-kwimpalastatus="alive"
                // data-kwimpalaid="1623214242467-2"
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
                // required
                type="text"
                value=""
                // data-kwimpalastatus="alive"
                // data-kwimpalaid="1623214242467-3"
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
                // required
                type="password"
                value=""
                // data-kwimpalastatus="alive"
                // data-kwimpalaid="1623214242467-0"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
            <div>
              <label htmlFor="<R>-confirm_password">CONFIRM PASSWORD</label>

              <input
                id="<R>-confirm_password"
                name="confirm_password"
                // required
                type="password"
                value=""
                // data-kwimpalastatus="alive"
                // data-kwimpalaid="1623214242467-1"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
          </fieldset>
          <div>
            <input
              // id="submit"
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(
      `running the function,` +
        ` which handles the 'onchange' event for \`${e.target.outerHTML}\``
    );
  };

  return (
    <React.Fragment>
      {"<Login>"}
      <div>
        <form method="POST" action="">
          {/* <input
            id="csrf_token"
            name="csrf_token"
            type="hidden"
            value="IjIxMjA5YjJiMDc4NTJmMGE4Y2NmYTg5MTRiZjQyZWMzMTllNTk5MGEi.YMBBGQ.-pGpwZNqzdLEsExWq3e70nZNJec"
          /> */}
          <fieldset>
            <legend>LOG IN</legend>

            <div>
              <label htmlFor="<L>-email">EMAIL</label>

              <input
                id="<L>-email"
                name="email"
                // required
                type="text"
                value=""
                // data-kwimpalastatus="alive"
                // data-kwimpalaid="1623212313076-1"
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
                // required
                type="password"
                value=""
                // data-kwimpalastatus="alive"
                // data-kwimpalaid="1623212313076-0"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
          </fieldset>
          <div>
            <input
              // id="submit"
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(
      `running the function,` +
        ` which handles the 'onchange' event for \`${e.target.outerHTML}\``
    );
  };

  return (
    <React.Fragment>
      {"<RequestPasswordReset>"}

      <div>
        <form method="POST" action="">
          {/* <input id="csrf_token" name="csrf_token" type="hidden" value="IjkzMTI1NzVmMjA2Y2Q1M2Q0ZDI3M2ZkZTE1NGZmNmMzYTlmOGVhMzEi.YMXboQ.CdFDKfaFrkgfbpYdhkamWmwJ0cA"> */}
          <fieldset>
            <legend>RESET PASSWORD</legend>
            <div>
              <label htmlFor="<RPR>-email">EMAIL</label>

              <input
                id="<RPR>-email"
                name="email"
                // required
                type="text"
                value=""
                // data-kwimpalastatus="alive"
                // data-kwimpalaid="1623579553224-0"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>
          </fieldset>
          <div>
            <input
              id="submit"
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

interface IEntry {
  id: number;
  source_language: string;
  new_word: string;
  content: string;
  content_translation: string;
}

const entriesMock: IEntry[] = [
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

export const OwnVocabTreasury = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <OwnVocabTreasury>`
  );

  const emailOfLoggedInUser = "john.doe@protonmail.com";

  const styleForLinkToCurrentPage = { fontSize: 40 };

  const entryTableRows = entriesMock.map((e: IEntry) => (
    <tr>
      <th style={styleForBorder}>
        <Link to={`/example/${e.id}?page=1`}>{e.id}</Link>
      </th>
      <th style={styleForBorder}>{e.source_language}</th>
      <th style={styleForBorder}>{e.new_word}</th>
      <th style={styleForBorder}>{e.content}</th>
      <th style={styleForBorder}>{e.content_translation}</th>
    </tr>
  ));

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
          {entryTableRows}
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
      {"<RecordNewExample>"}

      <div>
        <form method="POST" action="">
          {/* <input id="csrf_token" name="csrf_token" type="hidden" value="IjIxMjA5YjJiMDc4NTJmMGE4Y2NmYTg5MTRiZjQyZWMzMTllNTk5MGEi.YMGUkA.375Xt02E9Mh-V4Gq7C7jOA7_LKc"> */}
          <fieldset>
            <legend>[legend-tag]: CREATE NEW EXAMPLE</legend>
            <div>
              <label htmlFor="<RNE>-source_language">SOURCE LANGUAGE</label>

              <input
                id="<RNE>-source_language"
                name="source_language"
                type="text"
                value=""
                // data-kwimpalastatus="alive"
                // data-kwimpalaid="1623299217012-0"
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleChange(e)
                }
              />
            </div>

            <div>
              <label htmlFor="<RNE>-new_word">NEW WORD</label>

              <input
                id="<RNE>-new_word"
                name="new_word"
                // required
                type="text"
                value=""
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
                // required
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleChange(e)
                }
              />
            </div>
            <div>
              <label htmlFor="<RNE>-content_translation">TRANSLATION</label>

              <textarea
                id="<RNE>-content_translation"
                name="content_translation"
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  handleChange(e)
                }
              />
            </div>
            <div>
              <input
                // id="submit"
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

  const entry: IEntry = entriesMock[3];

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
            <th style={styleForBorder}>{entry.id}</th>
            <th style={styleForBorder}>{entry.source_language}</th>
            <th style={styleForBorder}>{entry.new_word}</th>
            <th style={styleForBorder}>{entry.content}</th>
            <th style={styleForBorder}>{entry.content_translation}</th>
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
        <Link to="/example/4/edit?page=1">Edit this example</Link>
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    console.log(
      `running the function,` +
        ` which handles the 'onchange' event for \`${e.target.outerHTML}\``
    );
  };

  const entry: IEntry = entriesMock[3];

  return (
    <React.Fragment>
      {"<EditExample>"}

      <form method="POST" action="">
        {/* <input id="csrf_token" name="csrf_token" type="hidden" value="IjkzMTI1NzVmMjA2Y2Q1M2Q0ZDI3M2ZkZTE1NGZmNmMzYTlmOGVhMzEi.YMW4YA.0bfe9pIF_AacUmo92b_dQpHUMVQ"> */}
        <fieldset>
          <legend>[legend-tag]: EDIT EXISTING EXAMPLE</legend>
          <div>
            <label htmlFor="<EE>-source_language">SOURCE LANGUAGE</label>

            <input
              id="<EE>-source_language"
              name="source_language"
              type="text"
              value={entry.source_language}
              // data-kwimpalastatus="alive"
              // data-kwimpalaid="1623570528862-0"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleChange(e)
              }
            />
          </div>
          <div>
            <label htmlFor="<EE>-new_word">NEW WORD</label>

            <input
              id="<EE>-new_word"
              name="new_word"
              // required
              type="text"
              value={entry.new_word}
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
              // required
              value={entry.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleChange(e)
              }
            />
          </div>
          <div>
            <label htmlFor="<EE>-content_translation">TRANSLATION</label>

            <textarea
              id="<EE>-content_translation"
              name="content_translation"
              value={entry.content_translation}
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(
      `running the function,` +
        ` which handles the 'onchange' event for \`${e.target.outerHTML}\``
    );
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
              {/* <input id="csrf_token" name="csrf_token" type="hidden" value="IjIxMjA5YjJiMDc4NTJmMGE4Y2NmYTg5MTRiZjQyZWMzMTllNTk5MGEi.YMGeIw.YoZgSG4uYKnMwx7EtMnwkEeNoD0"> */}
              <th style={styleForBorder}></th>
              <th style={styleForBorder}></th>
              <th style={styleForBorder}>
                <input
                  id="<S>-new_word"
                  name="new_word"
                  type="text"
                  value=""
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
                  value=""
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleChange(e)
                  }
                />
              </th>
              <th style={styleForBorder}>
                <input
                  id="<S>-content_translation"
                  name="content_translation"
                  type="text"
                  value=""
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
          <input
            // id="submit"
            name="submit"
            type="submit"
            value="SEARCH"
          />
        </div>
        <br />
      </form>
    </React.Fragment>
  );
};

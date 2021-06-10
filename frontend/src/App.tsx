import React from "react";

export const App = () => {
  console.log(`${new Date().toISOString()} - React is rendering <App>`);

  return (
    <React.Fragment>
      {"<App>"}
      <hr />
      <NavigationBar />
      <hr />
      <Home />
      <hr />
      <About />
      <hr />
      <Register />
      <hr />
      <Login />
      <hr />
      <Account />
      <hr />
      <OwnVocabTreasury />
      <hr />
      <RecordNewExample />
      <hr />
      <Search />
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
        <a href="/">VocabTreasury</a>
      </div>
      <div>
        <a href="/home">Home</a> <a href="/about">About</a>
      </div>
    </React.Fragment>
  );

  const guestUserLinks = (
    <div>
      <a href="/login">Log in</a> <a href="/register">Register</a>
    </div>
  );

  const loggedInUserLinks = (
    <div>
      <a href="/own-vocabtreasury">Own VocabTreasury</a>{" "}
      <a href="/account">Account</a> <a href="/logout">Log out</a>
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
          ALREADY HAVE AN ACCOUNT? <a href="/login">CLICK HERE TO LOG IN</a>
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
              <a href="/reset_password">FORGOT PASSWORD?</a>
            </small>
          </div>
        </form>
      </div>
      <div>
        <small>
          NEED AN ACCOUNT? <a href="/register">CLICK HERE TO REGISTER</a>
        </small>
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

export const OwnVocabTreasury = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <OwnVocabTreasury>`
  );

  const emailOfLoggedInUser = "john.doe@protonmail.com";

  const styleForLinkToCurrentPage = { fontSize: 40 };

  return (
    <React.Fragment>
      {"<OwnVocabTreasury>"}
      <h1>Own VocabTreasury for {emailOfLoggedInUser}</h1>
      <div>
        <a href="/example/new">Record new example</a>
      </div>
      <div>
        <a href="/own-vocabtreasury/search">Search</a>
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

          <tr>
            <th style={styleForBorder}>
              <a href="/example/1?page=1">1</a>
            </th>
            <th style={styleForBorder}>Finnish</th>
            <th style={styleForBorder}>vihata + P</th>
            <th style={styleForBorder}>Älä vihaa ketään!</th>
            <th style={styleForBorder}>Don't hate anyone!</th>
          </tr>

          <tr>
            <th style={styleForBorder}>
              <a href="/example/2?page=1">2</a>
            </th>
            <th style={styleForBorder}>Finnish</th>
            <th style={styleForBorder}>tulinen</th>
            <th style={styleForBorder}>
              "tulinen" ja "tulivuori" ovat samanlaisia sanoja.
            </th>
            <th style={styleForBorder}>
              "spicy" and "volcano" are similar words.
            </th>
          </tr>

          <tr>
            <th style={styleForBorder}>
              <a href="/example/3?page=1">3</a>
            </th>
            <th style={styleForBorder}>German</th>
            <th style={styleForBorder}>der Termin</th>
            <th style={styleForBorder}>
              Man muss erstens den Termin festsetzen und dann ihn einhalten.
            </th>
            <th style={styleForBorder}>
              One must firstly fix the deadline and then meet/observe it.
            </th>
          </tr>

          <tr>
            <th style={styleForBorder}>
              <a href="/example/4?page=1">4</a>
            </th>
            <th style={styleForBorder}>Finnish</th>
            <th style={styleForBorder}>sama</th>
            <th style={styleForBorder}>Olemme samaa mieltä.</th>
            <th style={styleForBorder}>I agree.</th>
          </tr>

          <tr>
            <th style={styleForBorder}>
              <a href="/example/5?page=1">5</a>
            </th>
            <th style={styleForBorder}>Finnish</th>
            <th style={styleForBorder}>pitää</th>
            <th style={styleForBorder}>Pidätkö koirista?</th>
            <th style={styleForBorder}>Do you like dogs?</th>
          </tr>

          <tr>
            <th style={styleForBorder}>
              <a href="/example/6?page=1">6</a>
            </th>
            <th style={styleForBorder}>Finnish</th>
            <th style={styleForBorder}>tykätä</th>
            <th style={styleForBorder}>Tykkäätkö koirista?</th>
            <th style={styleForBorder}>Do you like dogs?</th>
          </tr>

          <tr>
            <th style={styleForBorder}>
              <a href="/example/7?page=1">7</a>
            </th>
            <th style={styleForBorder}>Finnish</th>
            <th style={styleForBorder}>kannettava tietokone</th>
            <th style={styleForBorder}>
              Ota sinun kannettava tietokone kotiin!
            </th>
            <th style={styleForBorder}>Take your laptop home!</th>
          </tr>

          <tr>
            <th style={styleForBorder}>
              <a href="/example/10?page=1">10</a>
            </th>
            <th style={styleForBorder}>Finnish</th>
            <th style={styleForBorder}>teeskennellä</th>
            <th style={styleForBorder}>Älä teeskentele, että olet sairas!</th>
            <th style={styleForBorder}>Don't pretend that you're sick!</th>
          </tr>

          <tr>
            <th style={styleForBorder}>
              <a href="/example/11?page=1">11</a>
            </th>
            <th style={styleForBorder}>Finnish</th>
            <th style={styleForBorder}>teeskennellä</th>
            <th style={styleForBorder}>Älä teeskentele olevasi sairas!</th>
            <th style={styleForBorder}>Don't pretend that you're sick!</th>
          </tr>

          <tr>
            <th style={styleForBorder}>
              <a href="/example/12?page=1">12</a>
            </th>
            <th style={styleForBorder}>Finnish</th>
            <th style={styleForBorder}>teeskennellä</th>
            <th style={styleForBorder}>
              Miksi teeskentelimme pitävänsä hänen vitsistään?
            </th>
            <th style={styleForBorder}>
              Why did we pretend to like his jokes?
            </th>
          </tr>
        </tbody>
      </table>
      {/* <font size="14"> */}
      {/* 
                https://stackoverflow.com/questions/61002821/font-with-typescript-property-font-does-not-exist-on-type-jsx-intrinsicele
                
                `<font>`` is a deprecated tag in HTML,
                so TS will not include it in its type definitions.
                This, as well as many other tags, have been deprecated
                in favor of using CSS to style elements. */}
      <a style={styleForLinkToCurrentPage} href="/own-vocabtreasury?page=1">
        1
      </a>{" "}
      {/* </font> */}
      <a href="/own-vocabtreasury?page=2">2</a> ...{" "}
      <a href="/own-vocabtreasury?page=281">281</a>
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

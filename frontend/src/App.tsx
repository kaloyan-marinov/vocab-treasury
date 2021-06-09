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
    console.log(`handling the onChange event for \`${e.target.outerHTML}\``);
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
              <label htmlFor="username">USERNAME</label>

              <input
                // id="username"
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
              <label htmlFor="email">EMAIL</label>

              <input
                // id="email"
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
              <label htmlFor="password">PASSWORD</label>

              <input
                // id="password"
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
              <label htmlFor="confirm_password">CONFIRM PASSWORD</label>

              <input
                // id="confirm_password"
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
    console.log(`handling the onChange event for \`${e.target.outerHTML}\``);
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
              <label htmlFor="email">EMAIL</label>

              <input
                // id="email"
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
              <label htmlFor="password">PASSWORD</label>

              <input
                // id="password"
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

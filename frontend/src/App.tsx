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
      <Login />
    </React.Fragment>
  );
};

export const NavigationBar = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <NavigationBar>`
  );

  return (
    <React.Fragment>
      {"<NavigationBar>"}
      <div>
        <a href="/">VocabTreasury</a>
      </div>
      <div>
        <a href="/home">Home</a> <a href="/about">About</a>
      </div>
      <div>
        <a href="/login">Log in</a> <a href="/register">Register</a>
      </div>
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

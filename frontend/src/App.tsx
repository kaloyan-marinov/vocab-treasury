import React from "react";

export const App = () => {
  console.log(`${new Date().toISOString()} - React is rendering <App>`);

  return (
    <React.Fragment>
      {"<App>"}
      <div>
        <a href="/">VocabTreasury</a>
      </div>
      <div>
        <a href="/home">Home</a> <a href="/about">About</a>
      </div>
      <div>
        <a href="/login">Log in</a> <a href="/register">Register</a>
      </div>
      <div>
        <h1>Welcome to VocabTreasury!</h1>
      </div>
      <hr />
      <About />
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

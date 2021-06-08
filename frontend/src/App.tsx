import React from "react";

const App = () => {
  return (
    <React.Fragment>
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
    </React.Fragment>
  );
};

export default App;

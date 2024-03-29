import React from "react";

export const Home = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Home>`);

  return (
    <React.Fragment>
      {process.env.NODE_ENV === "development" && "<Home>"}
      <div>
        <h1>Welcome to VocabTreasury!</h1>
      </div>
    </React.Fragment>
  );
};

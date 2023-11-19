import React from "react";

export const About = () => {
  console.log(`${new Date().toISOString()} - React is rendering <About>`);

  return (
    <React.Fragment>
      {process.env.NODE_ENV === "development" && "<About>"}
      <h1>About VocabTreasury...</h1>
    </React.Fragment>
  );
};

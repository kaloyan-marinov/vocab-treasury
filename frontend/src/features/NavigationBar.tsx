import React from "react";
import { Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import { logOut, selectHasValidToken } from "../store";

export const NavigationBar = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <NavigationBar>`
  );

  const hasValidToken: boolean | null = useSelector(selectHasValidToken);
  console.log(`    hasValidToken: ${hasValidToken}`);

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

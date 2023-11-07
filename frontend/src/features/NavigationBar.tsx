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
        <Link to="/" className="btn btn-dark">
          VocabTreasury
        </Link>
      </div>
      <div>
        <Link to="/home" className="btn btn-dark">
          Home
        </Link>{" "}
        <Link to="/about" className="btn btn-dark">
          About
        </Link>
      </div>
    </React.Fragment>
  );

  const guestUserLinks = (
    <div>
      <Link to="/login" className="btn btn-dark">
        Log in
      </Link>{" "}
      <Link to="/register" className="btn btn-dark">
        Register
      </Link>
    </div>
  );

  const loggedInUserLinks = (
    <div>
      <Link to="/own-vocabtreasury" className="btn btn-dark">
        Own VocabTreasury
      </Link>{" "}
      <Link to="/account" className="btn btn-dark">
        Account
      </Link>{" "}
      <a
        href="#!"
        onClick={() => dispatch(logOut("LOGOUT SUCCESSFUL"))}
        className="btn btn-dark"
      >
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

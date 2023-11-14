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

  const linksForGuestUser = (
    <React.Fragment>
      <div>
        <Link to="/" className="btn btn-dark">
          VocabTreasury: Home
        </Link>{" "}
        <Link to="/about" className="btn btn-dark">
          About
        </Link>
      </div>
      <div>
        <Link to="/login" className="btn btn-dark">
          Log in
        </Link>{" "}
        <Link to="/register" className="btn btn-dark">
          Register
        </Link>
      </div>
    </React.Fragment>
  );

  const linksForLoggedInUser = (
    <React.Fragment>
      <div>
        <Link to="/own-vocabtreasury" className="btn btn-dark">
          Own VocabTreasury
        </Link>{" "}
        <Link to="/account" className="btn btn-dark">
          Account
        </Link>
      </div>
      <div>
        <a
          href="#!"
          onClick={() => dispatch(logOut("LOGOUT SUCCESSFUL"))}
          className="btn btn-dark"
        >
          Log out
        </a>
      </div>
    </React.Fragment>
  );

  return (
    <React.Fragment>
      {process.env.NODE_ENV === "development" && "<NavigationBar>"}
      <nav className="navbar navbar-light bg-light">
        {!hasValidToken ? linksForGuestUser : linksForLoggedInUser}
      </nav>
    </React.Fragment>
  );
};

import React from "react";
import { useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import { logOut, selectHasValidToken } from "../store";
import { NavigationBarLink } from "./NavigationBarLink";

export const NavigationBar = () => {
  console.log(
    `${new Date().toISOString()} - React is rendering <NavigationBar>`
  );

  const hasValidToken: boolean | null = useSelector(selectHasValidToken);
  console.log(`    hasValidToken: ${hasValidToken}`);

  const dispatch = useDispatch();

  const location = useLocation();

  const linksForGuestUser = (
    <React.Fragment>
      <div>
        <NavigationBarLink
          destination="/"
          isActive={location.pathname === "/"}
          text="VocabTreasury: Home"
        />{" "}
        <NavigationBarLink
          destination="/about"
          isActive={location.pathname === "/about"}
          text={"About"}
        />
      </div>
      <div>
        <NavigationBarLink
          destination="/login"
          isActive={location.pathname === "/login"}
          text={"Log in"}
        />{" "}
        <NavigationBarLink
          destination="/register"
          isActive={location.pathname === "/register"}
          text={"Register"}
        />
      </div>
    </React.Fragment>
  );

  const linksForLoggedInUser = (
    <React.Fragment>
      <div>
        <NavigationBarLink
          destination="/own-vocabtreasury"
          isActive={location.pathname === "/own-vocabtreasury"}
          text={"Own VocabTreasury"}
        />{" "}
        <NavigationBarLink
          destination="/account"
          isActive={location.pathname === "/account"}
          text={"Account"}
        />
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
      {process.env.NODE_ENV === "development" && <p>{location.pathname}</p>}
      <nav className="navbar navbar-light bg-light">
        {!hasValidToken ? linksForGuestUser : linksForLoggedInUser}
      </nav>
    </React.Fragment>
  );
};

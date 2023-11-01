import React from "react";
import { Switch, Route, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import { Alerts } from "./features/alerts/Alerts";

import { Home } from "./features/Home";

import { Register } from "./features/auth/Register";
import { Login } from "./features/auth/Login";
import { RequestPasswordReset } from "./features/auth/RequestPasswordReset";
import { fetchProfile } from "./features/auth/authSlice";

import { STYLE_FOR_BORDER, STYLE_FOR_TABLE } from "./constants";
import { IProfile } from "./types";

import { PrivateRoute } from "./features/auth/PrivateRoute";

import { OwnVocabTreasury } from "./features/examples/OwnVocabTreasury";
import { RecordNewExample } from "./features/examples/RecordNewExample";
import { SingleExample } from "./features/examples/SingleExample";
import { EditExample } from "./features/examples/EditExample";
import { Search } from "./features/examples/Search";

import {
  logOut,
  selectHasValidToken,
  selectLoggedInUserProfile,
} from "./store";

export const App = () => {
  console.log(`${new Date().toISOString()} - React is rendering <App>`);

  const dispatch = useDispatch();

  React.useEffect(() => {
    console.log(
      `${new Date().toISOString()} - React is running <App>'s useEffect hook`
    );

    const effectFn = async () => {
      console.log("    <App>'s useEffect hook is dispatching fetchProfile()");

      try {
        await dispatch(fetchProfile());
      } catch (err) {
        dispatch(logOut("TO CONTINUE, PLEASE LOG IN"));
      }
    };

    effectFn();
  }, [dispatch]);

  return (
    <React.Fragment>
      {"<App>"}
      <hr />
      <NavigationBar />
      <hr />
      <Alerts />
      <hr />
      <Switch>
        <Route exact path="/">
          <Home />
        </Route>
        <Route exact path="/home">
          <Home />
        </Route>
        <Route exact path="/about">
          <About />
        </Route>
        <Route exact path="/register">
          <Register />
        </Route>
        <Route exact path="/login">
          <Login />
        </Route>
        <Route exact path="/request_password_reset">
          <RequestPasswordReset />
        </Route>
        <PrivateRoute exact path="/account">
          <Account />
        </PrivateRoute>
        <PrivateRoute exact path="/own-vocabtreasury">
          <OwnVocabTreasury />
        </PrivateRoute>
        <PrivateRoute exact path="/example/new">
          <RecordNewExample />
        </PrivateRoute>
        <PrivateRoute exact path="/example/:id">
          <SingleExample />
        </PrivateRoute>
        <PrivateRoute exact path="/example/:id/edit">
          <EditExample />
        </PrivateRoute>
        <PrivateRoute exact path="/own-vocabtreasury/search">
          <Search />
        </PrivateRoute>
      </Switch>
    </React.Fragment>
  );
};

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

export const About = () => {
  console.log(`${new Date().toISOString()} - React is rendering <About>`);

  return (
    <React.Fragment>
      {"<About>"}
      <h1>About VocabTreasury...</h1>
    </React.Fragment>
  );
};

export const Account = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Account>`);

  const loggedInUserProfile: IProfile | null = useSelector(
    selectLoggedInUserProfile
  );

  const accountDetails: null | JSX.Element =
    loggedInUserProfile === null ? null : (
      <table style={STYLE_FOR_TABLE}>
        <thead>
          <tr>
            <th style={STYLE_FOR_BORDER}>KEY</th>
            <th style={STYLE_FOR_BORDER}>VALUE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={STYLE_FOR_BORDER}>ID</td>
            <td style={STYLE_FOR_BORDER}>{loggedInUserProfile.id}</td>
          </tr>
          <tr>
            <td style={STYLE_FOR_BORDER}>USERNAME</td>
            <td style={STYLE_FOR_BORDER}>{loggedInUserProfile.username}</td>
          </tr>
          <tr>
            <td style={STYLE_FOR_BORDER}>EMAIL</td>
            <td style={STYLE_FOR_BORDER}>{loggedInUserProfile.email}</td>
          </tr>
        </tbody>
      </table>
    );

  return (
    <React.Fragment>
      {"<Account>"}
      {accountDetails}
    </React.Fragment>
  );
};

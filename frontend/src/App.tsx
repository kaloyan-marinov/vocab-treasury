import { Dispatch } from "redux";
import React from "react";
import { Switch, Route, Link, useParams, useHistory } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { v4 as uuidv4 } from "uuid";

import { Alerts } from "./features/alerts/Alerts";
import {
  IActionAlertsCreate,
  alertsCreate,
} from "./features/alerts/alertsSlice";

import { Register } from "./features/auth/Register";
import { Login } from "./features/auth/Login";
import { RequestPasswordReset } from "./features/auth/RequestPasswordReset";
import { fetchProfile } from "./features/auth/authSlice";

import {
  URL_FOR_FIRST_PAGE_OF_EXAMPLES,
  styleForBorder,
  styleForTable,
} from "./constants";
import { IProfile, IExample } from "./types";

import { PrivateRoute } from "./features/auth/PrivateRoute";

import { OwnVocabTreasury } from "./features/examples/OwnVocabTreasury";
import { RecordNewExample } from "./features/examples/RecordNewExample";
import { SingleExample } from "./features/examples/SingleExample";
import { EditExample } from "./features/examples/EditExample";
import { Search } from "./features/examples/Search";

import {
  IState,
  logOut,
  selectHasValidToken,
  selectLoggedInUserProfile,
  selectExamplesIds,
  selectExamplesEntities,
  ActionFetchExamples,
  fetchExamples,
  selectExamplesMeta,
  selectExamplesLinks,
} from "./store";
import { ThunkDispatch } from "redux-thunk";

import { Redirect } from "react-router-dom";

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

export const Account = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Account>`);

  const loggedInUserProfile: IProfile | null = useSelector(
    selectLoggedInUserProfile
  );

  const accountDetails: null | JSX.Element =
    loggedInUserProfile === null ? null : (
      <table style={styleForTable}>
        <thead>
          <tr>
            <th style={styleForBorder}>KEY</th>
            <th style={styleForBorder}>VALUE</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={styleForBorder}>ID</td>
            <td style={styleForBorder}>{loggedInUserProfile.id}</td>
          </tr>
          <tr>
            <td style={styleForBorder}>USERNAME</td>
            <td style={styleForBorder}>{loggedInUserProfile.username}</td>
          </tr>
          <tr>
            <td style={styleForBorder}>EMAIL</td>
            <td style={styleForBorder}>{loggedInUserProfile.email}</td>
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

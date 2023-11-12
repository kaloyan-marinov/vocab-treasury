import React from "react";
import { Switch, Route } from "react-router-dom";
import { useDispatch } from "react-redux";

import { Alerts } from "./features/alerts/Alerts";
import { Home } from "./features/Home";
import { NavigationBar } from "./features/NavigationBar";
import { About } from "./features/About";
import { Account } from "./features/Account";
import { Register } from "./features/auth/Register";
import { Login } from "./features/auth/Login";
import { RequestPasswordReset } from "./features/auth/RequestPasswordReset";
import { fetchProfile } from "./features/auth/authSlice";
import { PrivateRoute } from "./features/auth/PrivateRoute";
import { OwnVocabTreasury } from "./features/examples/OwnVocabTreasury";
import { RecordNewExample } from "./features/examples/RecordNewExample";
import { SingleExample } from "./features/examples/SingleExample";
import { EditExample } from "./features/examples/EditExample";
import { Search } from "./features/examples/Search";
import { logOut } from "./store";

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
    <section className="container font-monospace">
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
    </section>
  );
};

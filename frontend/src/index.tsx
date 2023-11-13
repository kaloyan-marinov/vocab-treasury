import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import { store } from "./store";
import { App } from "./App";

import "bootstrap/dist/css/bootstrap.min.css";
// import "bootstrap/dist/css/bootstrap.css";
/*
Following the advice at https://create-react-app.dev/docs/adding-bootstrap/ ,
put any other [CSS-file] imports below
so that [the styles] from your components[/repository] [will take] precedence
over [Bootstrap's] default styles.
*/
import "./index.css";

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";

import { store } from "./store";
import { App } from "./App";

import "./index.css";
/*
TODO: (2023/11/09, 21:19)

      before submitting a pull request for review,
      determine whether
      keeping `index.css` in the repository makes any difference and/or sense
*/
import "bootstrap/dist/css/bootstrap.min.css";

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

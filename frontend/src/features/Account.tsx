import React from "react";
import { useSelector } from "react-redux";

import { STYLE_FOR_BORDER } from "../constants";
import { IProfile } from "../types";
import { selectLoggedInUserProfile } from "../store";

export const Account = () => {
  console.log(`${new Date().toISOString()} - React is rendering <Account>`);

  const loggedInUserProfile: IProfile | null = useSelector(
    selectLoggedInUserProfile
  );

  const accountDetails: null | JSX.Element =
    loggedInUserProfile === null ? null : (
      <table className="table table-striped">
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

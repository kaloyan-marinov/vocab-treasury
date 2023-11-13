import React from "react";
import { useSelector } from "react-redux";

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
            <th>KEY</th>
            <th>VALUE</th>
          </tr>
        </thead>
        <tbody className="table-group-divider">
          <tr>
            <td>ID</td>
            <td>{loggedInUserProfile.id}</td>
          </tr>
          <tr>
            <td>USERNAME</td>
            <td>{loggedInUserProfile.username}</td>
          </tr>
          <tr>
            <td>EMAIL</td>
            <td>{loggedInUserProfile.email}</td>
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

import React from "react";
import { useSelector } from "react-redux";
import { Route, Redirect } from "react-router-dom";

import {
  RequestStatus,
  selectAuthRequestStatus,
  selectHasValidToken,
} from "../../store";

export const PrivateRoute = (props: any) => {
  console.log(
    `${new Date().toISOString()} - React is rendering <PrivateRoute>`
  );

  console.log("    its children are as follows:");
  const childrenCount: number = React.Children.count(props.children);
  React.Children.forEach(props.children, (child, ind) => {
    console.log(
      `    child #${ind + 1} (out of ${childrenCount}): <${child.type.name}>`
    );
  });

  const { children, ...rest } = props;

  const authRequestStatus: RequestStatus = useSelector(selectAuthRequestStatus);
  console.log(`    authRequestStatus: ${authRequestStatus}`);

  const hasValidToken: boolean | null = useSelector(selectHasValidToken);
  console.log(`    hasValidToken: ${hasValidToken}`);

  if (authRequestStatus === RequestStatus.LOADING) {
    console.log(`    authRequestStatus: ${RequestStatus.LOADING}`);
    return React.Children.map(props.children, (child) => (
      <div>{`<${child.type.name}>`} - Loading...</div>
    ));
  } else if (!hasValidToken) {
    const nextURL: string = "/login";
    console.log(
      `    hasValidToken: ${hasValidToken} > redirecting to ${nextURL} ...`
    );
    return <Redirect to={nextURL} />;
  } else {
    console.log(
      `    hasValidToken: ${hasValidToken} > rendering the above-listed children`
    );
    return <Route {...rest}>{children}</Route>;
  }
};

import {
  DefaultRequestBody,
  RequestParams,
  ResponseComposition,
  RestContext,
  RestRequest,
} from "msw";

import { profileMock } from "./dataMocks";

/*
Mock handlers for HTTP requests.
Each of these mock handlers is "lone-standing",
i.e. independent of the other ones.
*/
const mockCreateUser = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition<any>,
  ctx: RestContext
) => {
  return res(
    ctx.status(201),
    ctx.json({
      id: 17,
      username: "mocked-request-jd",
    })
  );
};

const mockIssueJWSToken = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition<any>,
  ctx: RestContext
) => {
  return res(
    ctx.status(200),
    ctx.json({
      token: "mocked-token",
    })
  );
};

const mockFetchUserProfile = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition<any>,
  ctx: RestContext
) => {
  return res(ctx.status(200), ctx.json(profileMock));
};

export const requestHandlers = {
  // mockMultipleFailures,

  mockCreateUser,
  mockIssueJWSToken,
  mockFetchUserProfile,
};

import {
  DefaultRequestBody,
  RequestParams,
  ResponseComposition,
  RestContext,
  RestRequest,
} from "msw";

import { IExampleFromBackend } from "./store";
import {
  profileMock,
  examplesMock,
  mockPaginationFromBackend,
} from "./dataMocks";

/*
Mock handlers for HTTP requests.
Each of these mock handlers is "lone-standing",
i.e. independent of the other ones.
*/
/*
TODO: (2023/10/20, 07:42)

      before submitting a pull request for review,
      consolidate the `mockMultipleFailures` and `mockSingleFailure`
      into a `createMockFailure({ status, error, message, mockOnceOrMultiple })` function
*/
const mockMultipleFailures = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition<any>,
  ctx: RestContext
) => {
  return res(
    ctx.status(401),
    ctx.json({
      error: "[mocked] Bad Request",
      message: "[mocked] Incorrect email and/or password.",
    })
  );
};

const mockSingleFailure = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition<any>,
  ctx: RestContext
) => {
  return res.once(
    ctx.status(401),
    ctx.json({
      error: "[mocked] Unauthorized",
      message: "[mocked] Authentication in the Basic Auth format is required.",
    })
  );
};

const mockCreateUser = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition<any>,
  ctx: RestContext
) => {
  return res.once(
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
  return res.once(
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
  return res.once(ctx.status(200), ctx.json(profileMock));
};

const mockRequestPasswordReset = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition<any>,
  ctx: RestContext
) => {
  return res.once(
    ctx.status(202),
    ctx.json({
      message:
        "Sending an email with instructions for resetting your password...",
    })
  );
};

const mockFetchExamples = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition<any>,
  ctx: RestContext
) => {
  const perPage: number = 2;
  const page = parseInt(req.url.searchParams.get("page") || "1");

  const newWord = req.url.searchParams.get("new_word");
  const content = req.url.searchParams.get("content");
  const contentTranslation = req.url.searchParams.get("content_translation");

  const possiblyFilteredExamples: IExampleFromBackend[] = examplesMock.filter(
    (e: IExampleFromBackend) => {
      let isMatch: boolean = true;

      if (newWord !== null) {
        isMatch =
          isMatch &&
          e.new_word.toLowerCase().search(newWord.toLowerCase()) !== -1;
      }
      if (content !== null) {
        isMatch =
          isMatch &&
          e.content.toLowerCase().search(content.toLowerCase()) !== -1;
      }
      if (contentTranslation !== null) {
        isMatch =
          isMatch &&
          e.content_translation
            .toLowerCase()
            .search(contentTranslation.toLowerCase()) !== -1;
      }

      return isMatch;
    }
  );

  return res.once(
    ctx.status(200),
    ctx.json(
      mockPaginationFromBackend(
        possiblyFilteredExamples,
        perPage,
        page,
        newWord,
        content,
        contentTranslation
      )
    )
  );
};

const mockCreateExample = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition<any>,
  ctx: RestContext
) => {
  const source_language = (req!.body as Record<string, any>).source_language;
  const new_word = (req!.body as Record<string, any>).new_word;
  const content = (req!.body as Record<string, any>).content;
  const content_translation = (req!.body as Record<string, any>)
    .content_translation;

  const newExample: IExampleFromBackend = {
    id: examplesMock.length + 1,
    source_language,
    new_word,
    content,
    content_translation,
  };

  // this.mockEntries = [...this.mockEntries, newExample];

  return res.once(ctx.status(201), ctx.json(newExample));
};

export const requestHandlers = {
  mockMultipleFailures,
  mockSingleFailure,

  mockCreateUser,
  mockIssueJWSToken,
  mockFetchUserProfile,
  mockRequestPasswordReset,

  mockFetchExamples,
  mockCreateExample,
};

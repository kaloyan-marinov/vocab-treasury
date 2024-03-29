import {
  DefaultBodyType,
  PathParams,
  ResponseComposition,
  RestContext,
  RestRequest,
} from "msw";

import { IExampleFromBackend, IOptionsForCreatingMockHandler } from "./types";
import {
  MOCK_PROFILE,
  MOCK_EXAMPLES,
  mockPaginationFromBackend,
} from "./mockPiecesOfData";

/*
Mock handlers for HTTP requests.
Each of these mock handlers is "lone-standing",
i.e. independent of the other ones.
*/
export const createMockOneOrManyFailures = (
  description: string,
  options: IOptionsForCreatingMockHandler
) => {
  switch (description) {
    case "single failure": {
      const mockSingleFailure = (
        req: RestRequest<DefaultBodyType, PathParams<string>>,
        res: ResponseComposition<any>,
        ctx: RestContext
      ) => {
        return res.once(
          ctx.status(options.statusCode),
          ctx.json({
            error: options.error,
            message: options.message,
          })
        );
      };

      return mockSingleFailure;
    }

    case "multiple failures": {
      const mockMultipleFailures = (
        req: RestRequest<DefaultBodyType, PathParams<string>>,
        res: ResponseComposition<any>,
        ctx: RestContext
      ) => {
        return res(
          ctx.status(options.statusCode),
          ctx.json({
            error: options.error,
            message: options.message,
          })
        );
      };

      return mockMultipleFailures;
    }

    default:
      throw Error(`Encountered an invalid value: description='${description}'`);
  }
};

const mockCreateUser = (
  req: RestRequest<DefaultBodyType, PathParams<string>>,
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

const mockConfirmEmailAddress = (
  req: RestRequest<DefaultBodyType, PathParams<string>>,
  res: ResponseComposition<any>,
  ctx: RestContext
) => {
  return res.once(
    ctx.status(200),
    ctx.json({
      message:
        "[mocked] You have confirmed your email address successfully." +
        " You may now log in.",
    })
  );
};

const mockIssueJWSToken = (
  req: RestRequest<DefaultBodyType, PathParams<string>>,
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
  req: RestRequest<DefaultBodyType, PathParams<string>>,
  res: ResponseComposition<any>,
  ctx: RestContext
) => {
  return res.once(ctx.status(200), ctx.json(MOCK_PROFILE));
};

const mockRequestPasswordReset = (
  req: RestRequest<DefaultBodyType, PathParams<string>>,
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

// Describe the shape of the "req.body".
export interface PutRequestBody {
  source_language: string | null;
  new_word: string | null;
  content: string | null;
  content_translation: string | null;
}

// Describe the shape of the mocked response body.
export interface PutResponseBody {
  id: number;
  source_language: string;
  new_word: string;
  content: string;
  content_translation: string;
}

// Describe the shape of the "req.params".
export interface PutRequestParams {
  [id: string]: string;
}

export interface DeleteRequestParams extends PutRequestParams {}

export class RequestHandlingFacilitator {
  /*
  An instance of this class makes it possible
  to create mock handlers for HTTP requests.

  The mock handlers, which are created by a common instance of this class,
  are not "lone-standing";
  rather, such mock handlers depend on one another
  via the (common) state stored within the (class) instance.
  */

  mockExamples: IExampleFromBackend[];

  constructor() {
    this.mockExamples = [...MOCK_EXAMPLES];
  }

  createMockFetchExamples() {
    const mockFetchExamples = (
      req: RestRequest<DefaultBodyType, PathParams<string>>,
      res: ResponseComposition<any>,
      ctx: RestContext
    ) => {
      const perPage: number = 2;
      const page = parseInt(req.url.searchParams.get("page") || "1");

      const newWord = req.url.searchParams.get("new_word");
      const content = req.url.searchParams.get("content");
      const contentTranslation = req.url.searchParams.get(
        "content_translation"
      );

      const possiblyFilteredExamples: IExampleFromBackend[] =
        this.mockExamples.filter((e: IExampleFromBackend) => {
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
        });

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

    return mockFetchExamples;
  }

  createMockCreateExample() {
    const mockCreateExample = (
      req: RestRequest<DefaultBodyType, PathParams<string>>,
      res: ResponseComposition<any>,
      ctx: RestContext
    ) => {
      const source_language = (req!.body as Record<string, any>)
        .source_language;
      const new_word = (req!.body as Record<string, any>).new_word;
      const content = (req!.body as Record<string, any>).content;
      const content_translation = (req!.body as Record<string, any>)
        .content_translation;

      const newExample: IExampleFromBackend = {
        id: this.mockExamples.length + 1,
        source_language,
        new_word,
        content,
        content_translation,
      };

      this.mockExamples = [...this.mockExamples, newExample];

      return res.once(ctx.status(201), ctx.json(newExample));
    };

    return mockCreateExample;
  }

  createMockEditExample() {
    const mockEditExample = (
      req: RestRequest<PutRequestBody, PutRequestParams>,
      res: ResponseComposition<PutResponseBody>,
      ctx: RestContext
    ) => {
      let exampleIdStr: string;
      if (typeof req.params.id === "string") {
        exampleIdStr = req.params.id;
      } else {
        throw TypeError(
          `'typeof req.params.id' evaluates to ${typeof req.params.id}` +
            ` but must instead evaluate to 'string'`
        );
      }
      const exampleId: number = parseInt(exampleIdStr);

      const exampleIndex: number = this.mockExamples.findIndex(
        (e: IExampleFromBackend) => e.id === exampleId
      );

      const editedExample: IExampleFromBackend = {
        ...this.mockExamples[exampleIndex],
      };
      const { source_language, new_word, content, content_translation } =
        req.body;
      if (source_language !== null) {
        editedExample.source_language = source_language;
      }
      if (new_word !== null) {
        editedExample.new_word = new_word;
      }
      if (content !== null) {
        editedExample.content = content;
      }
      if (content_translation !== null) {
        editedExample.content_translation = content_translation;
      }

      this.mockExamples[exampleIndex] = editedExample;

      return res.once(ctx.status(200), ctx.json(editedExample));
    };

    return mockEditExample;
  }

  createMockDeleteExample() {
    const mockDeleteExample = (
      req: RestRequest<DefaultBodyType, DeleteRequestParams>,
      res: ResponseComposition<any>,
      ctx: RestContext
    ) => {
      let exampleIdStr: string;
      if (typeof req.params.id === "string") {
        exampleIdStr = req.params.id;
      } else {
        throw TypeError(
          `'typeof req.params.id' evaluates to ${typeof req.params.id}` +
            ` but must instead evaluate to 'string'`
        );
      }
      const exampleId: number = parseInt(exampleIdStr);

      this.mockExamples = this.mockExamples.filter(
        (example: IExampleFromBackend) => example.id !== exampleId
      );

      return res.once(ctx.status(204));
    };

    return mockDeleteExample;
  }
}

export const requestHandlers = {
  mockCreateUser,
  mockConfirmEmailAddress,
  mockIssueJWSToken,
  mockFetchUserProfile,
  mockRequestPasswordReset,
};

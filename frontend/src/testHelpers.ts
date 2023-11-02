import {
  DefaultRequestBody,
  RequestParams,
  ResponseComposition,
  RestContext,
  RestRequest,
} from "msw";

import { IExampleFromBackend } from "./types";
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
/*
TODO: (2023/10/20, 07:42)

      before submitting a pull request for review,
      consolidate the `mockMultipleFailures` and `mockSingleFailure`
      into a `createMockFailure({ status, error, message, mockOnceOrMultiple })` function

      +

      utilize that to reduce duplication
      in as many `requestInterceptionLayer.use` calls as possible
*/
const mockMultipleFailures = (
  req: RestRequest<DefaultRequestBody, RequestParams>,
  res: ResponseComposition<any>,
  ctx: RestContext
) => {
  return res(
    ctx.status(401),
    ctx.json({
      error: "[mocked] Unauthorized",
      message: "[mocked] Authentication in the Basic Auth format is required.",
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
  return res.once(ctx.status(200), ctx.json(MOCK_PROFILE));
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
  id: string;
}

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
      req: RestRequest<DefaultRequestBody, RequestParams>,
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
      req: RestRequest<DefaultRequestBody, RequestParams>,
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
      // res: ResponseComposition<any>,
      res: ResponseComposition<PutResponseBody>,
      ctx: RestContext
    ) => {
      /*
      const { id: exampleIdStr } = req.params;
      const exampleId: number = parseInt(exampleIdStr);

      const edited_source_language = (req!.body as Record<string, any>)
        .source_language;
      const edited_new_word = (req!.body as Record<string, any>).new_word;
      const edited_content = (req!.body as Record<string, any>).content;
      const edited_content_translation = (req!.body as Record<string, any>)
        .content_translation;

      this.mockExamples = this.mockExamples.map(
        (example: IExampleFromBackend) => {
          if (example.id !== exampleId) {
            return example;
          }

          // Emulate the backend's route-handling function for
          // PUT requests to /api/examples/:id .
          const editedExample: IExampleFromBackend = {
            ...example,
          };
          if (edited_source_language !== undefined) {
            editedExample.source_language = edited_source_language;
          }
          if (edited_new_word !== undefined) {
            editedExample.new_word = edited_new_word;
          }
          if (edited_content !== undefined) {
            editedExample.content = edited_content;
          }
          if (edited_content_translation !== undefined) {
            editedExample.content_translation = edited_content_translation;
          }

          return editedExample;
        }
      );

      const editedExample = this.mockExamples.filter(
        (entry: IExampleFromBackend) => entry.id === exampleId
      )[0];

      return res.once(ctx.status(200), ctx.json(editedExample));
      */

      const exampleId: number = parseInt(req.params.id);
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
      req: RestRequest<DefaultRequestBody, RequestParams>,
      res: ResponseComposition<any>,
      ctx: RestContext
    ) => {
      const exampleId: number = parseInt(req.params.id);

      this.mockExamples = this.mockExamples.filter(
        (example: IExampleFromBackend) => example.id !== exampleId
      );

      return res.once(ctx.status(204));
    };

    return mockDeleteExample;
  }
}

export const requestHandlers = {
  mockMultipleFailures,
  mockSingleFailure,

  mockCreateUser,
  mockIssueJWSToken,
  mockFetchUserProfile,
  mockRequestPasswordReset,
};

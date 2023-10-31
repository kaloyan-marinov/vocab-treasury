import { IProfile } from "./types";
import {
  IPaginationMetaFromBackend,
  IPaginationLinks,
  IExampleFromBackend,
} from "./types";

export const profileMock: IProfile = {
  id: 17,
  username: "mocked-jd",
  email: "mocked-john.doe@protonmail.com",
};

export const exampleMock: IExampleFromBackend = {
  id: 17,
  source_language: "Finnish",
  new_word: "varjo",
  content: "Suomen ideaalisää on 24 astetta varjossa.",
  content_translation: "Finland's ideal weather is 24 degrees in the shade.",
};

/* Mock the pagination of Example resources. */
/*
TODO: (2023/10/22, 10:08)

      before submitting a PR for review,
      rename the "constants" in this file to written in uppercase with underscores
      and
      rename this file to `mockPiecesOfData.ts`
*/
export const examplesMock: IExampleFromBackend[] = Array.from({
  length: 11,
}).map((_, index) => {
  return {
    id: index + 1,
    source_language: "Finnish",
    new_word: "sana numero-" + (index + 1).toString(),
    content: "lause numero-" + (index + 1).toString(),
    content_translation: "käännös numero-" + (index + 1).toString(),
  };
});

export const MOCK_EXAMPLE_AT_IDX_7 = examplesMock[7];

export const mockPaginationFromBackend = (
  examples: IExampleFromBackend[],
  perPage: number = 2,
  page: number = 1,
  newWord: string | null = null,
  content: string | null = null,
  contentTranslation: string | null = null
): {
  _meta: IPaginationMetaFromBackend;
  _links: IPaginationLinks;
  items: IExampleFromBackend[];
} => {
  /*
  Mock the paginated list of Example resource,
  which the backend responds with
  upon receiving a GET request to /api/examples.
  */

  const totalItems: number = examples.length;
  const totalPages: number = Math.ceil(totalItems / perPage);
  const itemsOnLastPage: number =
    totalItems % perPage !== 0 ? totalItems % perPage : perPage;

  const _meta: IPaginationMetaFromBackend = {
    total_items: totalItems,
    per_page: perPage,
    total_pages: totalPages,
    page,
  };

  let commonQueryParams: string[] = [];
  if (newWord !== null) {
    commonQueryParams.push(`new_word=${newWord}`);
  }
  if (content !== null) {
    commonQueryParams.push(`content=${content}`);
  }
  if (contentTranslation !== null) {
    commonQueryParams.push(`content_translation=${contentTranslation}`);
  }
  const commonQueryParamString =
    commonQueryParams.length > 0 ? "&" + commonQueryParams.join("&") : "";

  const _links: IPaginationLinks = {
    self:
      `/api/examples?per_page=${perPage}&page=${page}` + commonQueryParamString,
    next:
      page >= totalPages
        ? null
        : `/api/examples?per_page=${perPage}&page=${page + 1}` +
          commonQueryParamString,
    prev:
      page <= 1
        ? null
        : `/api/examples?per_page=${perPage}&page=${page - 1}` +
          commonQueryParamString,
    first: `/api/examples?per_page=${perPage}&page=1` + commonQueryParamString,
    last:
      `/api/examples?per_page=${perPage}&page=${totalPages}` +
      commonQueryParamString,
  };

  let items: IExampleFromBackend[];
  if (page > totalPages) {
    items = [];
  } else if (page <= 0) {
    items = Array.from({ length: perPage }).map((_, index) => {
      return examples[index];
    });
  } else {
    const startIndex: number = (page - 1) * perPage;
    const length: number = page === totalPages ? itemsOnLastPage : perPage;
    items = Array.from({ length: length }).map((_, index) => {
      return examples[startIndex + index];
    });
  }

  return {
    _meta,
    _links,
    items,
  };
};

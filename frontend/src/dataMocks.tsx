import {
  IProfile,
  IPaginationMetaFromBackend,
  IPaginationLinks,
  IExampleFromBackend,
} from "./store";

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
export const examplesMock: IExampleFromBackend[] = Array.from({
  length: 11,
}).map((_, index) => {
  return {
    id: index + 1,
    source_language: "Finnish",
    new_word: "sana #" + (index + 1).toString(),
    content: "lause #" + (index + 1).toString(),
    content_translation: "käännös #" + (index + 1).toString(),
  };
});

export const mockPaginationFromBackend = (
  examples: IExampleFromBackend[],
  perPage: number = 2,
  page: number = 1
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

  const _links: IPaginationLinks = {
    self: `/api/examples?per_page=${perPage}&page=${page}`,
    next:
      page >= totalPages
        ? null
        : `/api/examples?per_page=${perPage}&page=${page + 1}`,
    prev:
      page <= 1 ? null : `/api/examples?per_page=${perPage}&page=${page - 1}`,
    first: `/api/examples?per_page=${perPage}&page=1`,
    last: `/api/examples?per_page=${perPage}&page=${totalPages}`,
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

/*
console.log();
console.log(mockPaginationFromBackend(1));

console.log();
console.log(mockPaginationFromBackend(2));

console.log();
console.log(mockPaginationFromBackend(3));

console.log();
console.log(mockPaginationFromBackend(4));

console.log();
console.log(mockPaginationFromBackend(5));

console.log();
console.log(mockPaginationFromBackend(6));

console.log();
console.log(mockPaginationFromBackend(7));
*/

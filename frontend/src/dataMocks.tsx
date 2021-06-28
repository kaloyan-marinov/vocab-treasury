import { IProfile, IExampleFromBackend } from "./store";

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

const totalItems: number = 11;
const perPage: number = 2;
const totalPages: number = Math.ceil(totalItems / perPage);
const itemsOnLastPage: number =
  totalItems % perPage !== 0 ? totalItems % perPage : perPage;

const examplesMock: IExampleFromBackend[] = Array.from({
  length: totalItems,
}).map((_, index) => {
  return {
    id: index + 1,
    source_language: "Finnish",
    new_word: "sana #" + (index + 1).toString(),
    content: "lause #" + (index + 1).toString(),
    content_translation: "käännös #" + (index + 1).toString(),
  };
});

export const examplesMockEntities: {
  [exampleId: string]: IExampleFromBackend;
} = examplesMock.reduce(
  (
    examplesObj: { [exampleId: string]: IExampleFromBackend },
    e: IExampleFromBackend
  ) => {
    examplesObj[e.id] = e;
    return examplesObj;
  },
  {}
);

export const paginate = (page: number = 1) => {
  if (page <= 0 || page > totalPages) {
    throw new Error(`\`page\` must be >= 1 and <= ${totalPages}`);
  }

  const _meta = {
    total_items: totalItems,
    per_page: perPage,
    total_pages: totalPages,
    page,
  };

  const _links = {
    self: `/api/examples?per_page=${perPage}&page=${page}`,
    next:
      page === totalPages
        ? null
        : `/api/examples?per_page=${perPage}&page=${page + 1}`,
    prev:
      page === 1 ? null : `/api/examples?per_page=${perPage}&page=${page - 1}`,
    first: `/api/examples?per_page=${perPage}&page=1`,
    last: `/api/examples?per_page=${perPage}&page=${totalPages}`,
  };

  const startIndex: number = (page - 1) * perPage;
  const length: number = page === totalPages ? itemsOnLastPage : perPage;
  const items = Array.from({ length: length }).map((_, index) => {
    return examplesMock[startIndex + index];
  });

  return {
    _meta,
    _links,
    items,
  };
};

/*
console.log();
console.log(paginate(1));

console.log();
console.log(paginate(2));

console.log();
console.log(paginate(3));

console.log();
console.log(paginate(4));

console.log();
console.log(paginate(5));

console.log();
console.log(paginate(6));

console.log();
console.log(paginate(7));
*/

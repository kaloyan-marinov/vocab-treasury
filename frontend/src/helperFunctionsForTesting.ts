import {
  IExample,
  IExampleFromBackend,
  IPaginationLinks,
  IPaginationMeta,
  IPaginationMetaFromBackend,
} from "./types";

export const convertToPaginationInFrontend = (paginationFromBackend: {
  _meta: IPaginationMetaFromBackend;
  _links: IPaginationLinks;
  items: IExampleFromBackend[];
}): {
  meta: IPaginationMeta;
  links: IPaginationLinks;
  ids: number[];
  entities: { [exampleId: string]: IExample };
} => {
  const {
    _meta,
    _links: links,
    items,
  }: {
    _meta: IPaginationMetaFromBackend;
    _links: IPaginationLinks;
    items: IExampleFromBackend[];
  } = paginationFromBackend;

  const meta: IPaginationMeta = {
    totalItems: _meta.total_items,
    perPage: _meta.per_page,
    totalPages: _meta.total_pages,
    page: _meta.page,
  };
  const ids: number[] = items.map((e: IExampleFromBackend) => e.id);
  const entities: { [exampleId: string]: IExample } = items.reduce(
    (
      examplesObj: { [exampleId: string]: IExample },
      e: IExampleFromBackend
    ) => {
      examplesObj[e.id] = {
        id: e.id,
        sourceLanguage: e.source_language,
        newWord: e.new_word,
        content: e.content,
        contentTranslation: e.content_translation,
      };

      return examplesObj;
    },
    {}
  );

  return {
    meta,
    links,
    ids,
    entities,
  };
};

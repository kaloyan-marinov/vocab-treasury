import {
  IAlert,
  RequestStatus,
  IProfile,
  IPaginationMeta,
  IPaginationLinks,
  IExample,
  IPaginationMetaFromBackend,
  IExampleFromBackend,
  IStateExamples,
} from "./types";
import { INITIAL_STATE_AUTH, INITIAL_STATE_EXAMPLES } from "./constants";

// 1
import { IState, selectAlertsIds, selectAlertsEntities } from "./store";

// 3
import { profileMock } from "./dataMocks";

import {
  selectAuthRequestStatus,
  selectHasValidToken,
  selectLoggedInUserProfile,
} from "./store";

import {
  selectExamplesMeta,
  selectExamplesLinks,
  selectExamplesIds,
  selectExamplesEntities,
} from "./store";

import { mockPaginationFromBackend } from "./dataMocks";

import { convertToPaginationInFrontend } from "./helperFunctionsForTesting";

import { exampleMock } from "./dataMocks";

// 4
import { examplesMock } from "./dataMocks";

describe("selector functions", () => {
  let state: IState;

  beforeAll(() => {
    state = {
      alerts: {
        ids: ["alert-id-17"],
        entities: {
          "alert-id-17": {
            id: "alert-id-17",
            message: "PLEASE LOG IN.",
          },
        },
      },
      auth: {
        ...INITIAL_STATE_AUTH,
        requestStatus: RequestStatus.SUCCEEDED,
        loggedInUserProfile: {
          id: 17,
          username: "auth-jd",
          email: "auth-john.doe@protonmail.com",
        },
      },
      examples: {
        ...INITIAL_STATE_EXAMPLES,
        meta: {
          totalItems: 11,
          perPage: 2,
          totalPages: 6,
          page: 1,
        },
        links: {
          self: "/api/examples?per_page=2&page=1",
          next: "/api/examples?per_page=2&page=2",
          prev: null,
          first: "/api/examples?per_page=2&page=1",
          last: "/api/examples?per_page=2&page=6",
        },
        ids: [1, 2],
        entities: {
          "1": {
            id: 1,
            sourceLanguage: "Finnish",
            newWord: "sana numero-1",
            content: "lause numero-1",
            contentTranslation: "käännös numero-1",
          },
          "2": {
            id: 2,
            sourceLanguage: "Finnish",
            newWord: "sana numero-2",
            content: "lause numero-2",
            contentTranslation: "käännös numero-2",
          },
        },
      },
    };
  });

  test("selectAlertsIds", () => {
    const alertsIds: string[] = selectAlertsIds(state);

    expect(alertsIds).toEqual(["alert-id-17"]);
  });

  test("selectAlertsEntities", () => {
    const alertsEntities: { [alertId: string]: IAlert } =
      selectAlertsEntities(state);

    expect(alertsEntities).toEqual({
      "alert-id-17": {
        id: "alert-id-17",
        message: "PLEASE LOG IN.",
      },
    });
  });

  test("selectAuthRequestStatus", () => {
    const authRequestStatus: RequestStatus = selectAuthRequestStatus(state);

    expect(authRequestStatus).toEqual("succeeded");
  });

  test("selectHasValidToken", () => {
    const hasValidToken: boolean | null = selectHasValidToken(state);

    expect(hasValidToken).toEqual(null);
  });

  test("selectLoggedInUserProfile", () => {
    const loggedInUserProfile: IProfile | null =
      selectLoggedInUserProfile(state);

    expect(loggedInUserProfile).toEqual({
      id: 17,
      username: "auth-jd",
      email: "auth-john.doe@protonmail.com",
    });
  });

  test("selectExamplesMeta", () => {
    const meta: IPaginationMeta = selectExamplesMeta(state);

    expect(meta).toEqual({
      totalItems: 11,
      perPage: 2,
      totalPages: 6,
      page: 1,
    });
  });

  test("selectExamplesLinks", () => {
    const links: IPaginationLinks = selectExamplesLinks(state);

    expect(links).toEqual({
      self: "/api/examples?per_page=2&page=1",
      next: "/api/examples?per_page=2&page=2",
      prev: null,
      first: "/api/examples?per_page=2&page=1",
      last: "/api/examples?per_page=2&page=6",
    });
  });

  test("selectExamplesIds", () => {
    const ids: number[] = selectExamplesIds(state);

    expect(ids).toEqual([1, 2]);
  });

  test("selectExamplesEntities", () => {
    const entities: { [exampleId: string]: IExample } =
      selectExamplesEntities(state);

    expect(entities).toEqual({
      "1": {
        id: 1,
        sourceLanguage: "Finnish",
        newWord: "sana numero-1",
        content: "lause numero-1",
        contentTranslation: "käännös numero-1",
      },
      "2": {
        id: 2,
        sourceLanguage: "Finnish",
        newWord: "sana numero-2",
        content: "lause numero-2",
        contentTranslation: "käännös numero-2",
      },
    });
  });
});

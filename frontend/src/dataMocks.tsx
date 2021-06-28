import { IProfile, IExample } from "./store";

export const profileMock: IProfile = {
  id: 17,
  username: "mocked-jd",
  email: "mocked-john.doe@protonmail.com",
};

export const exampleMock: IExample = {
  id: 17,
  sourceLanguage: "Finnish",
  newWord: "varjo",
  content: "Suomen ideaalisää on 24 astetta varjossa.",
  contentTranslation: "Finland's ideal weather is 24 degrees in the shade.",
};

const examplesMock: IExample[] = [
  {
    id: 1,
    sourceLanguage: "Finnish",
    newWord: "vihata + P",
    content: "Älä vihaa ketään!",
    contentTranslation: "Don't hate anyone!",
  },
  {
    id: 2,
    sourceLanguage: "Finnish",
    newWord: "tulinen",
    content: `"tulinen" ja "tulivuori" ovat samanlaisia sanoja.`,
    contentTranslation: `"spicy" and "volcano" are similar words.`,
  },
  {
    id: 3,
    sourceLanguage: "German",
    newWord: "der Termin",
    content: "Man muss erstens den Termin festsetzen und dann ihn einhalten.",
    contentTranslation:
      "One must firstly fix the deadline and then meet/observe it.",
  },
  {
    id: 4,
    sourceLanguage: "Finnish",
    newWord: "sama",
    content: "Olemme samaa mieltä.",
    contentTranslation: "I agree.",
  },
  {
    id: 5,
    sourceLanguage: "Finnish",
    newWord: "pitää",
    content: "Pidätkö koirista?",
    contentTranslation: "Do you like dogs?",
  },
  {
    id: 6,
    sourceLanguage: "Finnish",
    newWord: "tykätä",
    content: "Tykkäätkö koirista?",
    contentTranslation: "Do you like dogs?",
  },
  {
    id: 7,
    sourceLanguage: "Finnish",
    newWord: "kannettava tietokone",
    content: "Ota sinun kannettava tietokone kotiin!",
    contentTranslation: "Ota sinun kannettava tietokone kotiin!",
  },
  {
    id: 10,
    sourceLanguage: "Finnish",
    newWord: "teeskennellä",
    content: "Älä teeskentele, että olet sairas!",
    contentTranslation: "Don't pretend that you're sick!",
  },
  {
    id: 11,
    sourceLanguage: "Finnish",
    newWord: "teeskennellä",
    content: "Älä teeskentele olevasi sairas!",
    contentTranslation: "Don't pretend that you're sick!",
  },
  {
    id: 12,
    sourceLanguage: "Finnish",
    newWord: "teeskennellä",
    content: "Miksi teeskentelimme pitävänsä hänen vitsistään?",
    contentTranslation: "Why did we pretend to like his jokes?",
  },
];

export const examplesMockEntities: { [exampleId: string]: IExample } =
  examplesMock.reduce(
    (examplesObj: { [exampleId: string]: IExample }, e: IExample) => {
      examplesObj[e.id] = e;
      return examplesObj;
    },
    {}
  );

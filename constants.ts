import { Question, Box, AppState } from './types.ts';

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 'q1',
    label: 'Full Name',
    description: 'Enter your legal first and last name',
    type: 'text',
    required: true,
    order: 0,
  },
  {
    id: 'q2',
    label: 'Email Address',
    type: 'email',
    required: true,
    order: 1,
  },
  {
    id: 'q3',
    label: 'In-Game Username',
    description: 'Your gamer tag or handle',
    type: 'text',
    required: false,
    order: 2,
  },
];

export const DEFAULT_BOXES: Box[] = Array.from({ length: 8 }, (_, i) => ({
  id: `box-${i + 1}`,
  name: `Team`, 
  capacity: 5,
}));

export const INITIAL_STATE: AppState = {
  questions: DEFAULT_QUESTIONS,
  players: [],
  boxes: DEFAULT_BOXES,
  settings: {
    eventTitle: "Tournament Registration",
    eventDescription: "Register now and pick your team box to participate in the upcoming tournament.",
    bannerUrl: "",
    bannerPosition: 50,
    showTeammates: true
  }
};

export const STORAGE_KEY = 'box_draft_app_v1';
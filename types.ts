export type QuestionType = 'text' | 'email' | 'number' | 'textarea';

export interface Question {
  id: string;
  label: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  order: number;
}

export interface Player {
  id: string;
  name: string; // We will treat the first text question as the "name" for display purposes
  answers: Record<string, string>;
  selectedBoxId: string | null;
  registeredAt: number;
}

export interface Box {
  id: string;
  name: string;
  capacity: number;
}

export interface AppState {
  questions: Question[];
  players: Player[];
  boxes: Box[];
  settings: {
    eventTitle: string;
    eventDescription: string;
    bannerUrl?: string;
    bannerPosition?: number; // 0 to 100 for vertical alignment
    showTeammates?: boolean; // Controls if players can see others in their box
  };
}
import type { AppData } from "@/types";
import { dataStore } from "./store";
import * as R from "./reducers";
import { rewardBus } from "@/lib/bus";
import { loadDemoData, removeDemoData } from "./demo";

type Args<F> = F extends (d: AppData, ...a: infer A) => unknown ? A : never;

/** מריץ reducer על המאגר, ומפעיל חגיגת תגמול (XP/הישג/רמה) אם נוצרה */
function bind<F extends (d: AppData, ...a: never[]) => R.Out>(fn: F) {
  return (...args: Args<F>): ReturnType<F> => {
    let result!: ReturnType<F>;
    dataStore.update((d) => {
      result = (fn as unknown as (d: AppData, ...a: unknown[]) => ReturnType<F>)(d, ...(args as unknown[]));
      return result.data;
    });
    if (result.rewards.length) rewardBus.emit(result.rewards);
    return result;
  };
}

export const act = {
  completeOnboarding: bind(R.completeOnboarding),
  updateProfile: bind(R.updateProfile),
  addSubject: bind(R.addSubject),
  updateSubject: bind(R.updateSubject),
  removeSubject: bind(R.removeSubject),
  addTopic: bind(R.addTopic),
  renameTopic: bind(R.renameTopic),
  removeTopic: bind(R.removeTopic),
  addHomework: bind(R.addHomework),
  updateHomework: bind(R.updateHomework),
  setHomeworkDone: bind(R.setHomeworkDone),
  removeHomework: bind(R.removeHomework),
  addExam: bind(R.addExam),
  updateExam: bind(R.updateExam),
  removeExam: bind(R.removeExam),
  generatePlanEvents: bind(R.generatePlanEvents),
  addQuestions: bind(R.addQuestions),
  updateQuestion: bind(R.updateQuestion),
  removeQuestion: bind(R.removeQuestion),
  finishAttempt: bind(R.finishAttempt),
  updateSubmission: bind(R.updateSubmission),
  removeAttempt: bind(R.removeAttempt),
  addMaterial: bind(R.addMaterial),
  updateMaterial: bind(R.updateMaterial),
  removeMaterial: bind(R.removeMaterial),
  addNote: bind(R.addNote),
  updateNote: bind(R.updateNote),
  removeNote: bind(R.removeNote),
  addFlashcards: bind(R.addFlashcards),
  updateFlashcard: bind(R.updateFlashcard),
  removeFlashcard: bind(R.removeFlashcard),
  reviewFlashcard: bind(R.reviewFlashcard),
  addEvent: bind(R.addEvent),
  updateEvent: bind(R.updateEvent),
  removeEvent: bind(R.removeEvent),
  setEventDone: bind(R.setEventDone),
  upsertSlot: bind(R.upsertSlot),
  removeSlot: bind(R.removeSlot),
  recordSession: bind(R.recordSession),
  removeSession: bind(R.removeSession),
  addConversation: bind(R.addConversation),
  updateConversation: bind(R.updateConversation),
  removeConversation: bind(R.removeConversation),
  addMessage: bind(R.addMessage),
  removeMessage: bind(R.removeMessage),
  clearAiHistory: bind(R.clearAiHistory),
  saveExercise: bind(R.saveExercise),
  removeExercise: bind(R.removeExercise),
  addGoal: bind(R.addGoal),
  removeGoal: bind(R.removeGoal),
  setNotifications: bind(R.setNotifications),
  loadDemoData: bind(loadDemoData),
  removeDemoData: bind(removeDemoData),
};

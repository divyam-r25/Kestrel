import * as core from './core.js';
import * as dev from './dev.js';
import * as student from './student.js';

export const ALL_SKILLS = [
  core.systemInfo, core.filesSearch, core.filesReadText, core.memoryRemember, core.memoryRecall,
  core.remindersAdd, core.remindersDue, core.shellRun,
  dev.portLookup, dev.gitSummary,
  student.notesAdd, student.notesSearch,
];

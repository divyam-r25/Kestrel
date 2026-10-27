import * as core from './core.js';
import * as dev from './dev.js';
import * as student from './student.js';
import * as apps from './apps.js';
import * as system from './system.js';
import * as web from './web.js';

export const ALL_SKILLS = [
  // core pack
  core.systemInfo, core.filesSearch, core.filesReadText,
  core.memoryRemember, core.memoryRecall,
  core.remindersAdd, core.remindersDue,
  core.shellRun,
  // core – new
  apps.appsLaunch,
  system.systemVolumeBrightness, system.filesOpenMove,
  web.webSearch,
  // dev pack
  dev.portLookup, dev.gitSummary,
  web.devExplainError,
  // student pack
  student.notesAdd, student.notesSearch, student.studyDeadlines,
];

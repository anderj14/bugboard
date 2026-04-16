import { BugContext } from "./bug-content";

export interface CreateBugDto {
  raw_description: string;
  reporter_name?: string;
  reporter_email?: string;
  source_app?: string;
  context?: BugContext;
}

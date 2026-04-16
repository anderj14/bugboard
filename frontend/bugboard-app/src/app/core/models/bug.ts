import { BugStatus } from "./bug-status";
import { SeverityLevel } from "./severity-level";

export interface Bug {
  id: string;
  raw_description: string;
  title?: string;
  severity?: SeverityLevel;
  module?: string;
  reproduction_steps?: string;
  suggested_fix?: string;
  ai_summary?: string;
  ai_confidence?: number;
  status: BugStatus;
  is_duplicate: boolean;
  duplicate_of_id?: string;
  browser?: string;
  operating_system?: string;
  current_url?: string;
  created_at: string;
  reporter_name?: string;
  reporter_email?: string;
  source_app?: string;
}
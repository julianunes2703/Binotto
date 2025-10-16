import { postJSON } from "../lib/api";

export const AnalyzerAPI = {
  analyze: (body) => postJSON({ path: "/analyze", body }),
};

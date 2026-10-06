export type Evidence = { source: string; detail: string };
export type Msg = {
  id: number;
  role: "user" | "nexus";
  text: string;
  evidence?: Evidence[];
  agents?: string[];
  requiresLogin?: boolean;
};

export interface ActionState {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
}

export const initialActionState: ActionState = { ok: false, message: "" };

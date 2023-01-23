import { LabeledDropdownEditor } from "./labeledDropdown";

export type ExtraEditorOptions = {
  labeledDropdown?: Partial<Parameters<typeof LabeledDropdownEditor>[0]>;
};

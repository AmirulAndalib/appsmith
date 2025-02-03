import type { PluginEditorDebuggerState } from "./pluginEditorReducer";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { type ReduxAction } from "actions/ReduxActionTypes";
import type { Action } from "entities/Action";

export const setPluginActionEditorDebuggerState = (
  payload: Partial<PluginEditorDebuggerState>,
) => ({
  type: ReduxActionTypes.SET_PLUGIN_ACTION_EDITOR_DEBUGGER_STATE,
  payload,
});

export const setPluginActionEditorSelectedTab = (payload: string) => ({
  type: ReduxActionTypes.SET_PLUGIN_ACTION_EDITOR_FORM_SELECTED_TAB,
  payload: {
    selectedTab: payload,
  },
});

export const openPluginActionSettings = (payload: boolean) => ({
  type: ReduxActionTypes.OPEN_PLUGIN_ACTION_SETTINGS,
  payload: {
    settingsOpen: payload,
  },
});

export const changeApi = (
  id: string,
  isSaas: boolean,
  newApi?: boolean,
): ReduxAction<{ id: string; isSaas: boolean; newApi?: boolean }> => {
  return {
    type: ReduxActionTypes.API_PANE_CHANGE_API,
    payload: { id, isSaas, newApi },
  };
};

export interface ChangeQueryPayload {
  baseQueryId: string;
  packageId?: string;
  applicationId?: string;
  basePageId?: string;
  moduleId?: string;
  workflowId?: string;
  newQuery?: boolean;
  action?: Action;
}

export const changeQuery = (payload: ChangeQueryPayload) => {
  return {
    type: ReduxActionTypes.QUERY_PANE_CHANGE,
    payload,
  };
};

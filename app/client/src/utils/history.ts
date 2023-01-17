// Leaving this require here. Importing causes type mismatches which have not been resolved by including the typings or any other means. Ref: https://github.com/remix-run/history/issues/802
const createHistory = require("history").createBrowserHistory;
import { History } from "history";

const history: History<AppsmithLocationState> = createHistory();
history.listen((pathname) => {
  debugger;
});
export default history;

export enum NavigationMethod {
  CommandClick = "CommandClick",
  EntityExplorer = "EntityExplorer",
  Omnibar = "Omnibar",
  Debugger = "Debugger",
}

export type AppsmithLocationState = {
  invokedBy?: NavigationMethod;
};

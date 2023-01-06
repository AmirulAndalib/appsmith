import React from "react";
import { createRoot } from "react-dom/client";
import "./wdyr";
import { connect, Provider } from "react-redux";
import "./index.css";
import { ThemeProvider } from "styled-components";
import { appInitializer } from "utils/AppUtils";
import { Slide } from "react-toastify";
import store, { runSagaMiddleware } from "./store";
import { Layers, LayersContext } from "constants/Layers";
import AppRouter from "@appsmith/AppRouter";
import * as Sentry from "@sentry/react";
import { getCurrentThemeDetails } from "selectors/themeSelectors";
import { AppState } from "@appsmith/reducers";
import { StyledToastContainer } from "design-system-old";
import "./assets/styles/index.css";
import "./polyfills/corejs-add-on";
import GlobalStyles from "globalStyles";
// enable autofreeze only in development
import { setAutoFreeze } from "immer";
import AppErrorBoundary from "AppErrorBoundry";

const shouldAutoFreeze = process.env.NODE_ENV === "development";
setAutoFreeze(shouldAutoFreeze);

runSagaMiddleware();

appInitializer();

function App() {
  return (
    <Sentry.ErrorBoundary fallback={<div>An error has occurred</div>}>
      <Provider store={store}>
        <LayersContext.Provider value={Layers}>
          <ThemedAppWithProps />
        </LayersContext.Provider>
      </Provider>
    </Sentry.ErrorBoundary>
  );
}

class ThemedApp extends React.Component<{
  currentTheme: any;
}> {
  render() {
    return (
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      <ThemeProvider theme={this.props.currentTheme}>
        <StyledToastContainer
          autoClose={5000}
          closeButton={false}
          draggable={false}
          hideProgressBar
          pauseOnHover={false}
          transition={Slide}
        />
        <GlobalStyles />
        <AppErrorBoundary>
          <AppRouter />
        </AppErrorBoundary>
      </ThemeProvider>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  currentTheme: getCurrentThemeDetails(state),
});

const ThemedAppWithProps = connect(mapStateToProps)(ThemedApp);

const container = document.getElementById("root");
const root = createRoot(container as HTMLElement);
root.render(<App />);

// expose store when run in Cypress
if ((window as any).Cypress) {
  (window as any).store = store;
}

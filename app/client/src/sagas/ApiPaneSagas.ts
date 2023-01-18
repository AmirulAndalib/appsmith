/**
 * Handles the Api pane ui state. It looks into the routing based on actions too
 * */
import get from "lodash/get";
import omit from "lodash/omit";
import { all, call, put, select, take, takeEvery } from "redux-saga/effects";
import * as Sentry from "@sentry/react";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
  ReduxActionWithMeta,
  ReduxFormActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { GetFormData, getFormData } from "selectors/formSelectors";
import {
  API_EDITOR_FORM_NAME,
  QUERY_EDITOR_FORM_NAME,
} from "@appsmith/constants/forms";
import {
  CONTENT_TYPE_HEADER_KEY,
  EMPTY_KEY_VALUE_PAIRS,
  POST_BODY_FORMAT_OPTIONS,
  POST_BODY_FORMAT_OPTIONS_ARRAY,
} from "constants/ApiEditorConstants/CommonApiConstants";
import { DEFAULT_CREATE_API_CONFIG } from "constants/ApiEditorConstants/ApiEditorConstants";
import { DEFAULT_CREATE_GRAPHQL_CONFIG } from "constants/ApiEditorConstants/GraphQLEditorConstants";
import history from "utils/history";
import { INTEGRATION_EDITOR_MODES, INTEGRATION_TABS } from "constants/routes";
import { initialize, autofill, change, reset } from "redux-form";
import { Property } from "api/ActionAPI";
import { createNewApiName } from "utils/AppsmithUtils";
import { getQueryParams } from "utils/URLUtils";
import { getPluginIdOfPackageName } from "sagas/selectors";
import {
  getAction,
  getActions,
  getDatasourceActionRouteInfo,
  getPlugin,
} from "selectors/entitiesSelector";
import {
  ActionData,
  ActionDataState,
} from "reducers/entityReducers/actionsReducer";
import {
  createActionRequest,
  setActionProperty,
} from "actions/pluginActionActions";
import {
  Action,
  ApiAction,
  PluginPackageName,
  PluginType,
} from "entities/Action";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";
import log from "loglevel";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { EventLocation } from "utils/AnalyticsUtil";
import { Toaster, Variant } from "design-system";
import {
  createMessage,
  ERROR_ACTION_RENAME_FAIL,
} from "@appsmith/constants/messages";
import {
  getContentTypeHeaderValue,
  getIndextoUpdate,
  parseUrlForQueryParams,
  queryParamsRegEx,
} from "utils/ApiPaneUtils";
import { updateReplayEntity } from "actions/pageActions";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { Plugin } from "api/PluginApi";
import { getDisplayFormat } from "selectors/apiPaneSelectors";
import {
  apiEditorIdURL,
  datasourcesEditorIdURL,
  integrationEditorURL,
} from "RouteBuilder";
import { getCurrentPageId } from "selectors/editorSelectors";
import { validateResponse } from "./ErrorSagas";
import { hasManageActionPermission } from "@appsmith/utils/permissionHelpers";
import {
  CreateDatasourceSuccessAction,
  removeTempDatasource,
} from "actions/datasourceActions";
import { klona } from "klona/lite";
import {
  AutoGeneratedHeader,
  deriveAutoGeneratedHeaderState,
} from "pages/Editor/APIEditor/helpers";

function* syncApiParamsSaga(
  actionPayload: ReduxActionWithMeta<string, { field: string }>,
  actionId: string,
) {
  const field = actionPayload.meta.field;
  //Payload here contains the path and query params of a typical url like https://{domain}/{path}?{query_params}
  const value = actionPayload.payload;
  // Regular expression to find the query params group
  PerformanceTracker.startTracking(PerformanceTransactionName.SYNC_PARAMS_SAGA);
  if (field === "actionConfiguration.path") {
    const params = parseUrlForQueryParams(value);
    yield put(
      autofill(
        API_EDITOR_FORM_NAME,
        "actionConfiguration.queryParameters",
        params,
      ),
    );
    yield put(
      setActionProperty({
        actionId: actionId,
        propertyName: "actionConfiguration.queryParameters",
        value: params,
      }),
    );
  } else if (field.includes("actionConfiguration.queryParameters")) {
    const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
    const path = values.actionConfiguration.path || "";
    const matchGroups = path.match(queryParamsRegEx) || [];
    const currentPath = matchGroups[1] || "";
    const paramsString = values.actionConfiguration.queryParameters
      .filter((p: Property) => p.key)
      .map(
        (p: Property, i: number) => `${i === 0 ? "?" : "&"}${p.key}=${p.value}`,
      )
      .join("");
    yield put(
      autofill(
        API_EDITOR_FORM_NAME,
        "actionConfiguration.path",
        `${currentPath}${paramsString}`,
      ),
    );
  }
  PerformanceTracker.stopTracking();
}

function* redirectToNewIntegrations(
  action: ReduxAction<{
    pageId: string;
    params?: Record<string, string>;
  }>,
) {
  history.push(
    integrationEditorURL({
      pageId: action.payload.pageId,
      selectedTab: INTEGRATION_TABS.ACTIVE,
      params: {
        ...action.payload.params,
        mode: INTEGRATION_EDITOR_MODES.AUTO,
      },
    }),
  );
}

function* handleUpdateBodyContentType(
  action: ReduxAction<{ title: string; apiId: string }>,
) {
  const { apiId, title } = action.payload;
  const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);

  const displayFormatValue = POST_BODY_FORMAT_OPTIONS_ARRAY.find(
    (el) => el === title,
  );
  if (!displayFormatValue) {
    log.error("Display format not supported", title);
    return;
  }

  // get headers
  const headers = klona(values.actionConfiguration.headers);

  // set autoGeneratedHeaders
  const autoGeneratedHeaders: AutoGeneratedHeader[] = [];

  const contentTypeHeaderIndex = headers.findIndex(
    (element: { key: string; value: string }) =>
      element &&
      element.key &&
      element.key.trim().toLowerCase() === CONTENT_TYPE_HEADER_KEY,
  );

  // Set an auto generated content type header for all post body format options except none.
  // also if we wish to add more auto genrated content-type the code goes inside here.
  if (displayFormatValue !== POST_BODY_FORMAT_OPTIONS.NONE) {
    // if theres content type
    if (contentTypeHeaderIndex !== -1) {
      autoGeneratedHeaders.push({
        key: CONTENT_TYPE_HEADER_KEY,
        value: displayFormatValue,
        isInvalid: true,
      });
    } else {
      autoGeneratedHeaders.push({
        key: CONTENT_TYPE_HEADER_KEY,
        value: displayFormatValue,
        isInvalid: false,
      });

      // Example of setting extra auto generated header.

      // autoGeneratedHeaders.push({
      //   key: "content-length",
      //   value: "0",
      //   isInvalid: false,
      // });

      // if there is no user specified content-type, default to auto-generated content-type
      yield put(
        change(
          API_EDITOR_FORM_NAME,
          "actionConfiguration.formData.apiContentType",
          displayFormatValue,
        ),
      );
    }
  }

  // change the autoGeneratedHeader value.
  yield put(
    change(
      API_EDITOR_FORM_NAME,
      "actionConfiguration.autoGeneratedHeaders",
      autoGeneratedHeaders,
    ),
  );

  // Quick Context: The extra formadata action is responsible for updating the current multi switch mode you see on api editor body tab
  // whenever a user selects a new content type through the tab e.g application/json, this action is dispatched to update that value, which is then read in the PostDataBody file
  // to show the appropriate content type section.
  yield put({
    type: ReduxActionTypes.SET_EXTRA_FORMDATA,
    payload: {
      id: apiId,
      values: {
        displayFormat: {
          label: title,
          value: title,
        },
      },
    },
  });

  // help to prevent cyclic dependency error in case the bodyFormData is empty.
  const bodyFormData = klona(values.actionConfiguration.bodyFormData);

  if (
    displayFormatValue === POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED ||
    displayFormatValue === POST_BODY_FORMAT_OPTIONS.MULTIPART_FORM_DATA
  ) {
    if (!bodyFormData || bodyFormData.length === 0) {
      yield put(
        change(
          API_EDITOR_FORM_NAME,
          "actionConfiguration.bodyFormData",
          EMPTY_KEY_VALUE_PAIRS.slice(),
        ),
      );
    }
  }
}

// TODO: make sure this is fixed for switching APIs
// this might have to go
function* updateExtraFormDataSaga() {
  const formData: GetFormData = yield select(getFormData, API_EDITOR_FORM_NAME);
  const { values } = formData;

  // when initializing, check if theres a display format present, if not use Json display format as default.
  const extraFormData: GetFormData = yield select(getDisplayFormat, values.id);

  const headers: Array<{ key: string; value: string }> =
    // this could be autoGeneratedHeaders
    get(values, "actionConfiguration.headers") || [];
  const contentTypeValue: string = getContentTypeHeaderValue(headers);

  let rawApiContentType;

  if (!extraFormData) {
    /*
     * Checking if the content-type header exists, if yes then set the body format type one of the three json, multipart or url encoded whichever matches else set raw as default
     */
    if (
      [
        POST_BODY_FORMAT_OPTIONS.JSON,
        POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED,
        POST_BODY_FORMAT_OPTIONS.MULTIPART_FORM_DATA,
      ].includes(contentTypeValue)
    ) {
      rawApiContentType = contentTypeValue;
    } else if (
      contentTypeValue === "" ||
      contentTypeValue === POST_BODY_FORMAT_OPTIONS.NONE
    ) {
      rawApiContentType = POST_BODY_FORMAT_OPTIONS.NONE;
    } else {
      rawApiContentType = POST_BODY_FORMAT_OPTIONS.RAW;
    }
  } else {
    if (
      [
        POST_BODY_FORMAT_OPTIONS.JSON,
        POST_BODY_FORMAT_OPTIONS.FORM_URLENCODED,
        POST_BODY_FORMAT_OPTIONS.MULTIPART_FORM_DATA,
      ].includes(contentTypeValue)
    ) {
      rawApiContentType = contentTypeValue;
    } else if (
      contentTypeValue === "" ||
      contentTypeValue === POST_BODY_FORMAT_OPTIONS.NONE
    ) {
      rawApiContentType = POST_BODY_FORMAT_OPTIONS.NONE;
    } else {
      rawApiContentType = POST_BODY_FORMAT_OPTIONS.RAW;
    }
  }

  // yield call(setHeaderFormat, values.id, rawApiContentType);
}

function* changeApiSaga(
  actionPayload: ReduxAction<{ id: string; isSaas: boolean; action?: Action }>,
) {
  PerformanceTracker.startTracking(PerformanceTransactionName.CHANGE_API_SAGA);
  const { id, isSaas } = actionPayload.payload;
  let { action } = actionPayload.payload;
  if (!action) action = yield select(getAction, id);
  if (!action) return;
  if (isSaas) {
    yield put(initialize(QUERY_EDITOR_FORM_NAME, action));
  } else {
    yield put(initialize(API_EDITOR_FORM_NAME, action));

    if (
      action.actionConfiguration &&
      action.actionConfiguration.queryParameters?.length
    ) {
      // Sync the api params my mocking a change action
      yield call(
        syncApiParamsSaga,
        {
          type: ReduxFormActionTypes.ARRAY_REMOVE,
          payload: action.actionConfiguration.queryParameters,
          meta: {
            field: "actionConfiguration.queryParameters",
          },
        },
        id,
      );
    }
  }

  //Retrieve form data with synced query params to start tracking change history.
  const { values: actionPostProcess } = yield select(
    getFormData,
    API_EDITOR_FORM_NAME,
  );
  PerformanceTracker.stopTracking();
  yield put(updateReplayEntity(id, actionPostProcess, ENTITY_TYPE.ACTION));
}

// this might have to go
function* setHeaderFormat(apiId: string, apiContentType?: string) {
  // use the current apiContentType to set appropriate Headers for action
  let displayFormat;

  if (apiContentType) {
    if (apiContentType === POST_BODY_FORMAT_OPTIONS.NONE) {
      displayFormat = {
        label: POST_BODY_FORMAT_OPTIONS.NONE,
        value: POST_BODY_FORMAT_OPTIONS.NONE,
      };
    } else if (
      apiContentType !== POST_BODY_FORMAT_OPTIONS.NONE &&
      Object.values(POST_BODY_FORMAT_OPTIONS).includes(apiContentType)
    ) {
      displayFormat = {
        label: apiContentType,
        value: apiContentType,
      };
    } else {
      displayFormat = {
        label: POST_BODY_FORMAT_OPTIONS.RAW,
        value: POST_BODY_FORMAT_OPTIONS.RAW,
      };
    }
  }

  yield put({
    type: ReduxActionTypes.SET_EXTRA_FORMDATA,
    payload: {
      id: apiId,
      values: {
        displayFormat,
      },
    },
  });
}

function* formValueChangeSaga(
  actionPayload: ReduxActionWithMeta<
    string,
    { field: string; form: string; index?: number }
  >,
) {
  try {
    const { field, form } = actionPayload.meta;
    if (form !== API_EDITOR_FORM_NAME) return;
    if (field === "dynamicBindingPathList" || field === "name") return;
    const { values } = yield select(getFormData, API_EDITOR_FORM_NAME);
    if (!values.id) return;
    if (!hasManageActionPermission(values.userPermissions)) {
      yield validateResponse({
        status: 403,
        resourceType: values?.pluginType,
        resourceId: values.id,
      });
    }

    const contentTypeHeaderIndex = values?.actionConfiguration?.headers?.findIndex(
      (header: { key: string; value: string }) =>
        header?.key?.trim().toLowerCase() === CONTENT_TYPE_HEADER_KEY,
    );

    const autoGeneratedContentTypeHeaderIndex = values?.actionConfiguration?.autoGeneratedHeaders?.findIndex(
      (header: { key: string; value: string }) =>
        header?.key?.trim().toLowerCase() === CONTENT_TYPE_HEADER_KEY,
    );

    const autoGeneratedHeaders =
      get(values, "actionConfiguration.autoGeneratedHeaders") || [];

    if (
      actionPayload.type === ReduxFormActionTypes.ARRAY_REMOVE ||
      actionPayload.type === ReduxFormActionTypes.ARRAY_PUSH
    ) {
      const value = get(values, field);
      yield put(
        setActionProperty({
          actionId: values.id,
          propertyName: field,
          value,
        }),
      );

      // if the user triggers a delete operation on any headers field
      if (field === `actionConfiguration.headers`) {
        // we get the updated auto generated header state based on the user specified content-type.
        const newAutoGeneratedHeaderState: AutoGeneratedHeader[] = deriveAutoGeneratedHeaderState(
          values?.actionConfiguration?.headers,
          autoGeneratedHeaders,
        );

        // update the autogenerated headers with the new autogenerated headers state.
        yield put(
          change(
            API_EDITOR_FORM_NAME,
            "actionConfiguration.autoGeneratedHeaders",
            newAutoGeneratedHeaderState,
          ),
        );

        // if there is an autogenerated content-type and the user specified content type has been deleted, set the apiContentType to the autoGenerated content-type value.
        if (
          autoGeneratedContentTypeHeaderIndex !== -1 &&
          contentTypeHeaderIndex === -1
        ) {
          if (autoGeneratedHeaders && autoGeneratedHeaders.length > 0) {
            const indexToUpdate = getIndextoUpdate(
              autoGeneratedHeaders,
              autoGeneratedContentTypeHeaderIndex,
            );
            if (autoGeneratedHeaders[indexToUpdate]?.isInvalid) {
              // update the apiContent-type value.
              yield put(
                change(
                  API_EDITOR_FORM_NAME,
                  "actionConfiguration.formData.apiContentType",
                  autoGeneratedHeaders[indexToUpdate].value,
                ),
              );
            }
          }
        }
      }
    } else {
      yield put(
        setActionProperty({
          actionId: values.id,
          propertyName: field,
          value: actionPayload.payload,
        }),
      );

      if (field.includes("actionConfiguration.headers")) {
        // if user is changing the header keys and if autoGenerated headers exist, derive new state based on the header value.
        if (
          field.includes(".key") &&
          autoGeneratedHeaders &&
          autoGeneratedHeaders.length > 0
        ) {
          const newAutoGeneratedHeaderState = deriveAutoGeneratedHeaderState(
            values?.actionConfiguration?.headers || [],
            autoGeneratedHeaders,
          );

          yield put(
            change(
              API_EDITOR_FORM_NAME,
              "actionConfiguration.autoGeneratedHeaders",
              newAutoGeneratedHeaderState,
            ),
          );
        }

        //  if both auto generated and user generated content types exist
        // set the apiContentType to user generated content type
        if (
          autoGeneratedContentTypeHeaderIndex !== -1 &&
          contentTypeHeaderIndex !== -1
        ) {
          yield put(
            change(
              API_EDITOR_FORM_NAME,
              "actionConfiguration.formData.apiContentType",
              values?.actionConfiguration?.headers[contentTypeHeaderIndex]
                ?.value || "",
            ),
          );

          //  else if auto generated content-type header exist, but theres no user specified content type header
          // set the apiContentType to auto generated content type
        } else if (
          autoGeneratedContentTypeHeaderIndex !== -1 &&
          contentTypeHeaderIndex === -1
        ) {
          if (autoGeneratedHeaders && autoGeneratedHeaders.length > 0) {
            const indexToUpdate = getIndextoUpdate(
              autoGeneratedHeaders,
              autoGeneratedContentTypeHeaderIndex,
            );

            // we still update the apiContentType.
            yield put(
              change(
                API_EDITOR_FORM_NAME,
                "actionConfiguration.formData.apiContentType",
                autoGeneratedHeaders[indexToUpdate].value,
              ),
            );
          }
        }
      }
    }

    // do something here
    // if (field === "actionConfiguration.httpMethod") {
    //   const value = actionPayload.payload;

    //   //When user switches to GET method, content type remains same (empty or any type)
    //   //This condition handles other HTTP methods
    //   if (value !== HTTP_METHOD.GET) {
    //     // ? do we want to set autogenerated headers when http is changed.
    //   }
    // }

    yield all([call(syncApiParamsSaga, actionPayload, values.id)]);

    // We need to refetch form values here since syncApuParams saga and updateFormFields directly update reform form values.
    const { values: formValuesPostProcess } = yield select(
      getFormData,
      API_EDITOR_FORM_NAME,
    );

    yield put(
      updateReplayEntity(
        formValuesPostProcess.id,
        formValuesPostProcess,
        ENTITY_TYPE.ACTION,
      ),
    );
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.SAVE_PAGE_ERROR,
      payload: {
        error,
      },
    });
    yield put(reset(API_EDITOR_FORM_NAME));
  }
}

function* handleActionCreatedSaga(actionPayload: ReduxAction<Action>) {
  const { id, pluginType } = actionPayload.payload;
  const action: Action | undefined = yield select(getAction, id);
  const data = action ? { ...action } : {};
  const pageId: string = yield select(getCurrentPageId);

  if (pluginType === PluginType.API) {
    yield put(initialize(API_EDITOR_FORM_NAME, omit(data, "name")));
    history.push(
      apiEditorIdURL({
        pageId,
        apiId: id,
        params: {
          editName: "true",
          from: "datasources",
        },
      }),
    );
  }
}

function* handleDatasourceCreatedSaga(
  actionPayload: CreateDatasourceSuccessAction,
) {
  const plugin: Plugin | undefined = yield select(
    getPlugin,
    actionPayload.payload.pluginId,
  );
  const pageId: string = yield select(getCurrentPageId);
  // Only look at API plugins
  if (plugin && plugin.type !== PluginType.API) return;

  const actionRouteInfo: Partial<{
    apiId: string;
    datasourceId: string;
    pageId: string;
    applicationId: string;
  }> = yield select(getDatasourceActionRouteInfo);

  // This will ensure that API if saved as datasource, will get attached with datasource
  // once the datasource is saved
  if (!!actionRouteInfo.apiId) {
    yield put(
      setActionProperty({
        actionId: actionRouteInfo.apiId,
        propertyName: "datasource",
        value: actionPayload.payload,
      }),
    );

    // we need to wait for action to be updated with respective datasource,
    // before redirecting back to action page, hence added take operator to
    // wait for update action to be complete.
    yield take(ReduxActionTypes.UPDATE_ACTION_SUCCESS);

    yield put({
      type: ReduxActionTypes.STORE_AS_DATASOURCE_COMPLETE,
    });

    // temp datasource data is deleted here, because we need temp data before
    // redirecting to api page, otherwise it will lead to invalid url page
    yield put(removeTempDatasource());
  }

  const { redirect } = actionPayload;

  // redirect back to api page
  if (actionRouteInfo && redirect) {
    history.push(
      apiEditorIdURL({
        pageId: actionRouteInfo?.pageId ?? "",
        apiId: actionRouteInfo.apiId ?? "",
      }),
    );
  } else {
    history.push(
      datasourcesEditorIdURL({
        pageId,
        datasourceId: actionPayload.payload.id,
        params: {
          from: "datasources",
          ...getQueryParams(),
          pluginId: plugin?.id,
        },
      }),
    );
  }
}

/**
 * Creates an API with datasource as DEFAULT_REST_DATASOURCE (No user created datasource)
 * @param action
 */
function* handleCreateNewApiActionSaga(
  action: ReduxAction<{
    pageId: string;
    from: EventLocation;
    apiType?: string;
  }>,
) {
  const workspaceId: string = yield select(getCurrentWorkspaceId);
  const { pageId, apiType = PluginPackageName.REST_API } = action.payload;
  const pluginId: string = yield select(getPluginIdOfPackageName, apiType);
  // Default Config is Rest Api Plugin Config
  let defaultConfig = DEFAULT_CREATE_API_CONFIG;
  if (apiType === PluginPackageName.GRAPHQL) {
    defaultConfig = DEFAULT_CREATE_GRAPHQL_CONFIG;
  }

  if (pageId && pluginId) {
    const actions: ActionDataState = yield select(getActions);
    const pageActions = actions.filter(
      (a: ActionData) => a.config.pageId === pageId,
    );
    const newActionName = createNewApiName(pageActions, pageId);
    // Note: Do NOT send pluginId on top level here.
    // It breaks embedded rest datasource flow.
    yield put(
      createActionRequest({
        actionConfiguration: defaultConfig.config,
        name: newActionName,
        datasource: {
          name: defaultConfig.datasource.name,
          pluginId,
          workspaceId,
        },
        eventData: {
          actionType: defaultConfig.eventData.actionType,
          from: action.payload.from,
        },
        pageId,
      } as ApiAction), // We don't have recursive partial in typescript for now.
    );
  }
}

function* handleApiNameChangeSaga(
  action: ReduxAction<{ id: string; name: string }>,
) {
  yield put(change(API_EDITOR_FORM_NAME, "name", action.payload.name));
}
function* handleApiNameChangeSuccessSaga(
  action: ReduxAction<{ actionId: string }>,
) {
  const { actionId } = action.payload;
  const actionObj: Action | undefined = yield select(getAction, actionId);
  yield take(ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_SUCCESS);
  if (!actionObj) {
    // Error case, log to sentry
    Toaster.show({
      text: createMessage(ERROR_ACTION_RENAME_FAIL, ""),
      variant: Variant.danger,
    });

    Sentry.captureException(
      new Error(createMessage(ERROR_ACTION_RENAME_FAIL, "")),
      {
        extra: {
          actionId: actionId,
        },
      },
    );
    return;
  }
  if (actionObj.pluginType === PluginType.API) {
    const params = getQueryParams();
    if (params.editName) {
      params.editName = "false";
    }
    history.push(
      apiEditorIdURL({
        pageId: actionObj.pageId,
        apiId: actionId,
        params,
      }),
    );
  }
}

function* handleApiNameChangeFailureSaga(
  action: ReduxAction<{ oldName: string }>,
) {
  yield put(change(API_EDITOR_FORM_NAME, "name", action.payload.oldName));
}

export default function* root() {
  yield all([
    takeEvery(ReduxActionTypes.API_PANE_CHANGE_API, changeApiSaga),
    takeEvery(ReduxActionTypes.CREATE_ACTION_SUCCESS, handleActionCreatedSaga),
    takeEvery(
      ReduxActionTypes.CREATE_DATASOURCE_SUCCESS,
      handleDatasourceCreatedSaga,
    ),
    takeEvery(ReduxActionTypes.SAVE_ACTION_NAME_INIT, handleApiNameChangeSaga),
    takeEvery(
      ReduxActionTypes.SAVE_ACTION_NAME_SUCCESS,
      handleApiNameChangeSuccessSaga,
    ),
    takeEvery(
      ReduxActionErrorTypes.SAVE_ACTION_NAME_ERROR,
      handleApiNameChangeFailureSaga,
    ),
    takeEvery(
      ReduxActionTypes.CREATE_NEW_API_ACTION,
      handleCreateNewApiActionSaga,
    ),
    takeEvery(
      ReduxActionTypes.UPDATE_API_ACTION_BODY_CONTENT_TYPE,
      handleUpdateBodyContentType,
    ),
    takeEvery(
      ReduxActionTypes.REDIRECT_TO_NEW_INTEGRATIONS,
      redirectToNewIntegrations,
    ),
    // Intercepting the redux-form change actionType
    takeEvery(ReduxFormActionTypes.VALUE_CHANGE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_REMOVE, formValueChangeSaga),
    takeEvery(ReduxFormActionTypes.ARRAY_PUSH, formValueChangeSaga),
  ]);
}

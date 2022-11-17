import { Popover2 } from "@blueprintjs/popover2";
import React, { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import {
  Button,
  Category,
  Icon,
  IconSize,
  Size,
  Spinner,
  Text,
  TextInput,
  TextType,
  Toaster,
  TooltipComponent as Tooltip,
  Variant,
} from "design-system";
import { EntityClassNames } from "../Entity";
import {
  ADD_PAGE_TOOLTIP,
  createMessage,
  customJSLibraryMessages,
} from "ce/constants/messages";
import { TOOLTIP_HOVER_ON_DELAY } from "constants/AppConstants";
import { Position } from "@blueprintjs/core";
import EntityAddButton from "../Entity/AddButton";
import ProfileImage from "pages/common/ProfileImage";
import { Colors } from "constants/Colors";
import { isValidURL } from "utils/URLUtils";
import { useDispatch, useSelector } from "react-redux";
import {
  selectInstallationStatus,
  selectInstalledLibraries,
  selectIsLibraryInstalled,
  selectQueuedLibraries,
  selectStatusForURL,
} from "selectors/entitiesSelector";
import SaveSuccessIcon from "remixicon-react/CheckboxCircleFillIcon";
import SaveFailureIcon from "remixicon-react/ErrorWarningFillIcon";
import { InstallState } from "reducers/uiReducers/libraryReducer";
import recommendedLibraries from "./recommendedLibraries";
import { AppState } from "ce/reducers";
import { TJSLibrary } from "utils/DynamicBindingUtils";
import { clearInstalls, installLibraryInit } from "actions/JSLibraryActions";

type TInstallWindowProps = any;

const Wrapper = styled.div`
  display: flex;
  height: auto;
  width: 400px;
  max-height: 80vh;
  flex-direction: column;
  padding: 0 16px;
  .installation-header {
    padding: 20px 0 0;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .search-area {
    margin-bottom: 16px;
    .left-icon {
      margin-left: 14px;
      .cs-icon {
        margin-right: 0;
      }
    }
    display: flex;
    flex-direction: column;
    .search-bar {
      margin-bottom: 8px;
    }
  }
  .search-body {
    display: flex;
    flex-direction: column;
    overflow: auto;
    .search-CTA {
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
    }
    .search-results {
      .library-card {
        cursor: pointer;
        gap: 8px;
        padding: 8px;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        border-bottom: 1px solid var(--appsmith-color-black-100);
        &:hover {
          background-color: var(--appsmith-color-black-50);
        }
        .description {
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          font-size: 12px;
          line-clamp: 2;
          font-weight: 400;
          -webkit-box-orient: vertical;
        }
      }
    }
  }
`;

export default function InstallationWindow(props: TInstallWindowProps) {
  const { className, open } = props;
  const [show, setShow] = useState(open);
  const dispatch = useDispatch();

  useEffect(() => {
    setShow(open);
  }, [open]);

  const clearProcessedInstalls = useCallback(() => {
    dispatch(clearInstalls());
  }, [dispatch]);

  const closeWindow = useCallback(() => {
    setShow(false);
    clearProcessedInstalls();
  }, [clearProcessedInstalls]);

  return (
    <Popover2
      className="h-9"
      content={<InstallationPopoverContent closeWindow={closeWindow} />}
      isOpen={show}
      minimal
      onClose={() => {
        clearProcessedInstalls();
        setShow(false);
      }}
      placement="right-start"
      transitionDuration={0}
    >
      <Tooltip
        boundary="viewport"
        className={EntityClassNames.TOOLTIP}
        content={createMessage(ADD_PAGE_TOOLTIP)}
        disabled={show}
        hoverOpenDelay={TOOLTIP_HOVER_ON_DELAY}
        position={Position.RIGHT}
      >
        <EntityAddButton
          className={`${className} ${show ? "selected" : ""}`}
          onClick={() => setShow(true)}
        />
      </Tooltip>
    </Popover2>
  );
}

const InstallationProgressWrapper = styled.div<{ addBorder: boolean }>`
  border-top: ${(props) =>
    props.addBorder ? `1px solid var(--appsmith-color-black-300)` : "none"};
  display: flex;
  flex-direction: column;
  background: var(--appsmith-color-black-50);
  text-overflow: ellipsis;
  padding: 8px 8px 12px;
  .install-url {
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    word-break: break-all;
  }
  .error-card {
    display: flex;
    padding: 10px;
    flex-direction: row;
    background: #ffe9e9;
    .unsupported {
      line-height: 17px;
      .header {
        font-size: 13px;
        font-weight: 600;
        color: #393939;
      }
      .body {
        font-size: 12px;
        font-weight: 400;
      }
    }
  }
`;

function getStatusIcon(status: InstallState, isInstalled = false) {
  if (status === InstallState.Success || isInstalled)
    return <SaveSuccessIcon color={Colors.GREEN} size={18} />;
  if (status === InstallState.Failed)
    return (
      <Icon fillColor={Colors.GRAY} name="warning-line" size={IconSize.XL} />
    );
  if (status === InstallState.Queued) return <Spinner />;
  return <Icon fillColor={Colors.GRAY} name="download" size={IconSize.XL} />;
}

function ProgressTracker({
  addBorder,
  status,
  url,
}: {
  addBorder: boolean;
  status: InstallState;
  url: string;
}) {
  return (
    <InstallationProgressWrapper addBorder={addBorder}>
      {[InstallState.Queued, InstallState.Installing].includes(status) && (
        <div className="text-gray-700 text-xs">Installing...</div>
      )}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center gap-2 fw-500 text-sm">
          <div className="install-url text-sm font-medium">{url}</div>
          <div className="shrink-0">{getStatusIcon(status)}</div>
        </div>
        {status === InstallState.Failed && (
          <div className="gap-2 error-card items-start">
            <Icon name="danger" size={IconSize.XL} />
            <div className="flex flex-col unsupported gap-1">
              <div className="header">
                {createMessage(customJSLibraryMessages.UNSUPPORTED_LIB)}
              </div>
              <div className="body">
                {createMessage(customJSLibraryMessages.UNSUPPORTED_LIB_DESC)}
              </div>
              <div className="footer text-xs font-medium gap-2 flex flex-row">
                <a>{createMessage(customJSLibraryMessages.REPORT_ISSUE)}</a>
                <a>{createMessage(customJSLibraryMessages.LEARN_MORE)}</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </InstallationProgressWrapper>
  );
}

function InstallationProgress() {
  const installStatusMap = useSelector(selectInstallationStatus);
  const urls = Object.keys(installStatusMap).filter(
    (url) => !recommendedLibraries.find((lib) => lib.url === url),
  );
  if (urls.length === 0) return null;
  return (
    <div>
      {urls.map((url, idx) => (
        <ProgressTracker
          addBorder={idx !== 0}
          key={`${url}_${idx}`}
          status={installStatusMap[url]}
          url={url}
        />
      ))}
    </div>
  );
}

enum Repo {
  Unpkg,
  JsDelivr,
}

function InstallationPopoverContent(props: any) {
  const { closeWindow } = props;
  const [URL, setURL] = useState("");
  const [isValid, setIsValid] = useState(true);
  const dispatch = useDispatch();
  const installedLibraries = useSelector(selectInstalledLibraries);
  const queuedLibraries = useSelector(selectQueuedLibraries);

  const updateURL = useCallback((value: string) => {
    setURL(value);
  }, []);

  const openDoc = useCallback((e, repo: Repo) => {
    e.preventDefault();
    if (repo === Repo.Unpkg) return window.open("https://unpkg.com");
    window.open("https://www.jsdelivr.com/");
  }, []);

  const validate = useCallback((text) => {
    const isValid = !text || isValidURL(text);
    setIsValid(isValid);
    return {
      isValid,
      message: isValid ? "" : "Please enter a valid URL",
    };
  }, []);

  const installLibrary = useCallback(
    (lib?: Partial<TJSLibrary>) => {
      const url = lib?.url || URL;
      const isQueued = queuedLibraries.find((libURL) => libURL === url);
      if (isQueued) return;

      const libInstalled = installedLibraries.find((lib) => lib.url === url);
      if (libInstalled) {
        Toaster.show({
          text: createMessage(
            customJSLibraryMessages.INSTALLED_ALREADY,
            libInstalled.accessor,
          ),
          variant: Variant.info,
        });
        return;
      }
      dispatch(
        installLibraryInit({
          url,
          name: lib?.name,
        }),
      );
    },
    [URL, installedLibraries, queuedLibraries],
  );

  return (
    <Wrapper>
      <div className="installation-header">
        <Text type={TextType.H1} weight={"bold"}>
          {createMessage(customJSLibraryMessages.ADD_JS_LIBRARY)}
        </Text>
        <Icon
          fillColor={Colors.GRAY}
          name="close-modal"
          onClick={closeWindow}
          size={IconSize.XXL}
        />
      </div>
      <div className="search-area">
        <div className="flex flex-row gap-2 justify-between items-center">
          <TextInput
            $padding="12px"
            data-testid="library-url"
            height="30px"
            leftIcon="link-2"
            onChange={updateURL}
            padding="12px"
            placeholder="Paste a library URL"
            validator={validate}
            width="100%"
          />
          {URL && isValid && (
            <Button
              category={Category.primary}
              data-testid="install-library-btn"
              icon="download"
              onClick={() => installLibrary()}
              size={Size.medium}
              tag="button"
              text="INSTALL"
              type="button"
            />
          )}
        </div>
      </div>
      <div className="search-body">
        <div className="search-CTA mb-3 text-xs">
          <span>
            Explore libraries on{" "}
            <a
              className="text-primary-500"
              onClick={(e) => openDoc(e, Repo.JsDelivr)}
            >
              jsDelivr
            </a>{" "}
            or{" "}
            <a
              className="text-primary-500"
              onClick={(e) => openDoc(e, Repo.Unpkg)}
            >
              UNPKG
            </a>
            {". "}
            {createMessage(customJSLibraryMessages.LEARN_MORE_DESC)}{" "}
            <a
              className="text-primary-500"
              onClick={(e) => openDoc(e, Repo.Unpkg)}
            >
              here.
            </a>
          </span>
        </div>
        <InstallationProgress />
        <div className="pb-2 sticky top-0 z-2 bg-white">
          <Text type={TextType.P1} weight={"600"}>
            {createMessage(customJSLibraryMessages.REC_LIBRARY)}
          </Text>
        </div>
        <div className="search-results">
          {recommendedLibraries.map((lib, idx) => (
            <LibraryCard
              key={`${idx}_${lib.name}`}
              lib={lib}
              onClick={() => installLibrary(lib)}
            />
          ))}
        </div>
      </div>
    </Wrapper>
  );
}

function LibraryCard({
  lib,
  onClick,
}: {
  lib: any;
  onClick: (url: string) => void;
}) {
  const status = useSelector(selectStatusForURL(lib.url));
  const isInstalled = useSelector((state: AppState) =>
    selectIsLibraryInstalled(state, lib.url),
  );
  return (
    <div className="library-card" onClick={() => onClick(lib.url)}>
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row gap-2 items-center">
          <Text type={TextType.P0} weight="500">
            {lib.name}
          </Text>
          <Icon fillColor={Colors.GRAY} name="share-2" size={IconSize.XS} />
        </div>
        {getStatusIcon(status, isInstalled)}
      </div>
      <div className="flex flex-row description">{lib.description}</div>
      <div className="flex flex-row items-center gap-1">
        <ProfileImage size={20} source={lib.icon} />
        <Text type={TextType.P3}>{lib.author}</Text>
      </div>
    </div>
  );
}

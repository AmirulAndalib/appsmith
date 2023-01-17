import React, { useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import styled, { ThemeProvider } from "styled-components";
import {
  ApplicationPayload,
  Page,
} from "@appsmith/constants/ReduxActionConstants";
import { connect, useSelector } from "react-redux";
import { AppState } from "@appsmith/reducers";
import {
  getCurrentPageId,
  getViewModePageList,
  getCurrentPageDescription,
} from "selectors/editorSelectors";
import { FormDialogComponent } from "components/editorComponents/form/FormDialogComponent";
import AppInviteUsersForm from "pages/workspace/AppInviteUsersForm";
import { getCurrentWorkspaceId } from "@appsmith/selectors/workspaceSelectors";

import { getCurrentUser } from "selectors/usersSelectors";
import { ANONYMOUS_USERNAME, User } from "constants/userConstants";
import { Theme } from "constants/DefaultTheme";
import ProfileDropdown from "pages/common/ProfileDropdown";
import PageTabsContainer from "./PageTabsContainer";
import { getThemeDetails, ThemeMode } from "selectors/themeSelectors";
import { showAppInviteUsersDialogSelector } from "selectors/applicationSelectors";
import { getSelectedAppTheme } from "selectors/appThemingSelectors";
import HtmlTitle from "./AppViewerHtmlTitle";
import PrimaryCTA from "./PrimaryCTA";
import Button from "./AppViewerButton";
import MenuIcon from "remixicon-react/MenuFillIcon";
import CloseIcon from "remixicon-react/CloseFillIcon";
import PageMenu from "./PageMenu";
import TourCompletionMessage from "pages/Editor/GuidedTour/TourCompletionMessage";
import { useHref } from "pages/Editor/utils";
import { builderURL } from "RouteBuilder";
import {
  createMessage,
  INVITE_USERS_MESSAGE,
  INVITE_USERS_PLACEHOLDER,
} from "@appsmith/constants/messages";
import { getAppsmithConfigs } from "@appsmith/configs";
import { NavigationSetting, NAVIGATION_SETTINGS } from "constants/AppConstants";
import {
  getApplicationNameTextColor,
  getMenuContainerBackgroundColor,
} from "./utils";
import { get } from "lodash";
import { Icon } from "design-system";

const { cloudHosting } = getAppsmithConfigs();

/**
 * ----------------------------------------------------------------------------
 * STYLED
 *-----------------------------------------------------------------------------
 */

const HeaderRow = styled.div`
  width: 100%;
  display: flex;
  flex-direction: row;
  border-bottom: 1px solid
    ${(props) => props.theme.colors.header.tabsHorizontalSeparator};
`;

const HeaderRightItemContainer = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

type AppViewerHeaderProps = {
  currentApplicationDetails?: ApplicationPayload;
  pages: Page[];
  currentWorkspaceId: string;
  currentUser?: User;
  lightTheme: Theme;
};

const StyledNav = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  background-color: ${({ navColorStyle, primaryColor }) =>
    getMenuContainerBackgroundColor(primaryColor, navColorStyle)};
`;

const StyledApplicationName = styled.div<{
  primaryColor: string;
  navColorStyle: NavigationSetting["colorStyle"];
}>`
  color: ${({ navColorStyle, primaryColor }) =>
    getApplicationNameTextColor(primaryColor, navColorStyle)};
`;

export function AppViewerHeader(props: AppViewerHeaderProps) {
  const selectedTheme = useSelector(getSelectedAppTheme);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const {
    currentApplicationDetails,
    currentUser,
    currentWorkspaceId,
    pages,
  } = props;
  const { search } = useLocation();
  const queryParams = new URLSearchParams(search);
  const isEmbed = queryParams.get("embed");
  const hideHeader = !!isEmbed;
  const showAppInviteUsersDialog = useSelector(
    showAppInviteUsersDialogSelector,
  );
  const pageId = useSelector(getCurrentPageId);
  const editorURL = useHref(builderURL, { pageId });
  const navColorStyle =
    currentApplicationDetails?.navigationSetting?.colorStyle ||
    NAVIGATION_SETTINGS.COLOR_STYLE.LIGHT;
  const primaryColor = get(
    selectedTheme,
    "properties.colors.primaryColor",
    "inherit",
  );
  const description = useSelector(getCurrentPageDescription);

  if (hideHeader) return <HtmlTitle />;

  return (
    <ThemeProvider theme={props.lightTheme}>
      <>
        <StyledNav
          className="relative js-appviewer-header"
          data-testid={"t--appsmith-app-viewer-header"}
          navColorStyle={navColorStyle}
          primaryColor={primaryColor}
          ref={headerRef}
        >
          <HtmlTitle
            description={description}
            name={currentApplicationDetails?.name}
          />
          <HeaderRow className="relative h-12 px-3 py-3 md:px-6">
            <section className="flex items-center gap-3 z-1">
              <div
                className="block w-5 h-5 cursor-pointer md:hidden"
                onClick={() => setMenuOpen((prevState) => !prevState)}
              >
                {isMenuOpen ? (
                  <CloseIcon className="w-5 h-5" />
                ) : (
                  <MenuIcon className="w-5 h-5" />
                )}
              </div>
              {/* TODO - @Dhruvik - ImprovedAppNav */}
              {/* Remove the following if no button comes to the left of header */}
              {/* <div className="">
                {currentUser?.username !== ANONYMOUS_USERNAME && (
                  <BackToHomeButton
                    navColorStyle={navColorStyle}
                    primaryColor={primaryColor}
                  />
                )}
              </div> */}
            </section>
            <div className="absolute top-0 bottom-0 flex items-center w-full mt-auto">
              <StyledApplicationName
                className="w-7/12 overflow-hidden text-base font-medium overflow-ellipsis whitespace-nowrap"
                navColorStyle={navColorStyle}
                primaryColor={primaryColor}
              >
                {currentApplicationDetails?.name}
              </StyledApplicationName>
            </div>
            <section className="relative flex items-center ml-auto space-x-3 z-1">
              {currentApplicationDetails && (
                <div className="hidden space-x-1 md:flex">
                  {/* Since the Backend doesn't have navigationSetting field by default
                  and we are creating the default values only when any nav settings via the
                  settings pane has changed, we need to hide the share button ONLY when the showShareApp
                  setting is explicitly set to false by the user via the settings pane. */}
                  {currentApplicationDetails?.navigationSetting
                    ?.showShareApp !== false && (
                    <FormDialogComponent
                      Form={AppInviteUsersForm}
                      applicationId={currentApplicationDetails.id}
                      canOutsideClickClose
                      headerIcon={{
                        name: "right-arrow",
                        bgColor: "transparent",
                      }}
                      isOpen={showAppInviteUsersDialog}
                      message={createMessage(
                        INVITE_USERS_MESSAGE,
                        cloudHosting,
                      )}
                      placeholder={createMessage(
                        INVITE_USERS_PLACEHOLDER,
                        cloudHosting,
                      )}
                      title={currentApplicationDetails.name}
                      trigger={
                        <Button
                          borderRadius={
                            selectedTheme.properties.borderRadius
                              .appBorderRadius
                          }
                          className="h-8"
                          data-cy="viewmode-share"
                          navColorStyle={navColorStyle}
                          primaryColor={primaryColor}
                        >
                          <Icon
                            fillColor={getApplicationNameTextColor(
                              primaryColor,
                              navColorStyle,
                            )}
                            name="share-line"
                            size="extraLarge"
                          />
                        </Button>
                      }
                      workspaceId={currentWorkspaceId}
                    />
                  )}

                  <HeaderRightItemContainer>
                    <PrimaryCTA
                      className="t--back-to-editor"
                      navColorStyle={navColorStyle}
                      primaryColor={primaryColor}
                      url={editorURL}
                    />
                  </HeaderRightItemContainer>
                </div>
              )}
              {currentUser && currentUser.username !== ANONYMOUS_USERNAME && (
                <HeaderRightItemContainer>
                  <ProfileDropdown
                    modifiers={{
                      offset: {
                        enabled: true,
                        offset: `0, 0`,
                      },
                    }}
                    name={currentUser.name}
                    photoId={currentUser?.photoId}
                    userName={currentUser?.username || ""}
                  />
                </HeaderRightItemContainer>
              )}
            </section>
          </HeaderRow>
          <PageTabsContainer
            currentApplicationDetails={currentApplicationDetails}
            pages={pages}
          />
        </StyledNav>
        <PageMenu
          application={currentApplicationDetails}
          headerRef={headerRef}
          isOpen={isMenuOpen}
          pages={pages}
          setMenuOpen={setMenuOpen}
          url={editorURL}
        />
        <TourCompletionMessage />
      </>
    </ThemeProvider>
  );
}

const mapStateToProps = (state: AppState): AppViewerHeaderProps => ({
  pages: getViewModePageList(state),
  currentApplicationDetails: state.ui.applications.currentApplication,
  currentWorkspaceId: getCurrentWorkspaceId(state),
  currentUser: getCurrentUser(state),
  lightTheme: getThemeDetails(state, ThemeMode.LIGHT),
});

export default connect(mapStateToProps)(AppViewerHeader);

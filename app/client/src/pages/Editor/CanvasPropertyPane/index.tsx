import React, { useState } from "react";
import * as Sentry from "@sentry/react";

import { MainContainerLayoutControl } from "../MainContainerLayoutControl";
import ThemeEditor from "../ThemePropertyPane/ThemeEditor";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { LayoutDirection, Positioning } from "components/constants";
import { useDispatch } from "react-redux";
import { batchUpdateMultipleWidgetProperties } from "actions/controlActions";
import { useSelector } from "store";
import { getWidgets } from "sagas/selectors";
import { Dropdown, DropdownOption, RenderOption } from "design-system";

const Title = styled.p`
  color: ${Colors.GRAY_800};
`;

type Props = {
  skipThemeEditor?: boolean;
};

const PositioningOptions = () => {
  const dispatch = useDispatch();
  const widgets = useSelector(getWidgets);
  const options: DropdownOption[] = [
    { label: "Fixed", value: Positioning.Fixed },
    { label: "Vertical stack", value: Positioning.Vertical },
  ];
  const [selectedOption, setSelectedOption] = useState<number>(() => {
    if (widgets && widgets["0"].positioning) {
      return options
        .map((each) => each.value)
        .indexOf(widgets["0"].positioning);
    }
    return 0;
  });
  const renderOption: RenderOption = ({ isSelectedNode, option }) => (
    <div
      className={`flex space-x-2  w-full hover:bg-gray-200 cursor-pointer ${
        isSelectedNode ? "px-2 py-2" : "px-2 py-2 "
      }`}
      onClick={() => {
        setSelectedOption(options.indexOf(option as DropdownOption));
        dispatch(
          batchUpdateMultipleWidgetProperties([
            {
              widgetId: "0",
              updates: {
                modify: {
                  positioning: (option as DropdownOption).value,
                  direction:
                    (option as DropdownOption).value === Positioning.Vertical
                      ? LayoutDirection.Vertical
                      : LayoutDirection.Horizontal,
                },
              },
            },
          ]),
        );
      }}
    >
      <div className="leading-normal">{(option as DropdownOption).label}</div>
    </div>
  );
  return (
    <section className="space-y-2">
      <Dropdown
        options={options}
        renderOption={renderOption}
        selected={options[selectedOption]}
        showLabelOnly
        width="100%"
      />
    </section>
  );
};

export function CanvasPropertyPane(props: Props) {
  return (
    <div className="relative ">
      <h3 className="px-4 py-3 text-sm font-medium uppercase">Properties</h3>

      <div className="mt-3 space-y-6">
        <div className="px-4 space-y-2">
          <Title className="text-sm">Canvas Size</Title>
          <MainContainerLayoutControl />
        </div>
        {!props.skipThemeEditor && (
          <div className="px-3 space-y-2">
            <p className="text-sm text-gray-700">Positioning</p>
            <PositioningOptions />
          </div>
        )}
        {!props.skipThemeEditor && <ThemeEditor />}
      </div>
    </div>
  );
}

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default Sentry.withProfiler(CanvasPropertyPane);

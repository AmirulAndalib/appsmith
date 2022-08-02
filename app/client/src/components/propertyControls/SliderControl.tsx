import React, { ChangeEventHandler } from "react";
import BaseControl, { ControlData, ControlProps } from "./BaseControl";

import styled from "constants/DefaultTheme";
import { ISliderProps, Slider } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import { replayHighlightClass } from "globalStyles/portals";
import { WidgetHeightLimits } from "constants/WidgetConstants";

const StyledSlider = styled.input<{ progress: number }>`
  & {
    height: 30px;
    width: 100%;
    margin: 0;
    -webkit-appearance: none;
    background-color: transparent;
  }

  &::-moz-focus-outer {
    border: 0;
  }

  &:focus {
    outline: none;
  }

  &::-webkit-slider-runnable-track {
    background: linear-gradient(
      to right,
      #090707 calc(${(props) => props.progress}%),
      #dddddd calc(${(props) => props.progress}%)
    );
    border-radius: 3px;
    height: 3px;
    will-change: transform;
  }

  &::-moz-range-track {
    background: linear-gradient(
      to right,
      #090707 calc(${(props) => props.progress}%),
      #dddddd calc(${(props) => props.progress}%)
    );
    border-radius: 3px;
    height: 3px;
    will-change: transform;
  }

  &:disabled::-webkit-slider-runnable-track {
    background: var(--framer-fresco-sliderTrackDisabled-color, #eeeeee);
  }

  &:disabled::-moz-range-track {
    background: var(--framer-fresco-sliderTrackDisabled-color, #eeeeee);
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    background-color: var(--framer-fresco-sliderKnob-color, #ffffff);
    border: none;
    border-radius: 50%;
    box-shadow: var(
      --framer-fresco-sliderKnob-shadow,
      0px 1px 3px 0px rgba(0, 0, 0, 0.2),
      0px 0.5px 0px 0px rgba(0, 0, 0, 0.1)
    );
    cursor: pointer;
    height: 12px;
    margin-top: -5px;
    opacity: 1;
    width: 12px;
    will-change: transform;
  }

  &::-moz-range-thumb {
    -webkit-appearance: none;
    background-color: var(--framer-fresco-sliderKnob-color, #ffffff);
    border: none;
    border-radius: 50%;
    box-shadow: var(
      --framer-fresco-sliderKnob-shadow,
      0px 1px 3px 0px rgba(0, 0, 0, 0.2),
      0px 0.5px 0px 0px rgba(0, 0, 0, 0.1)
    );
    cursor: pointer;
    height: 12px;
    margin-top: -5px;
    opacity: 1;
    width: 12px;
    will-change: transform;
  }

  &:disabled::-webkit-slider-thumb {
    display: none;
  }

  &:disabled::-moz-range-thumb {
    display: none;
  }
`;

interface SliderProps {
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onChange: (value: number) => void;
  onRelease: () => void;
  onStart: () => void;
  value: number;
}

function AdsSlider({
  onChange,
  onMouseEnter,
  onMouseLeave,
  onRelease,
  onStart,
  value,
}: SliderProps) {
  const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    onChange(parseInt(e.target.value, 10));
  };

  return (
    <StyledSlider
      max={100}
      min={4}
      onChange={handleChange}
      onMouseDown={onStart}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onMouseUp={onRelease}
      progress={value}
      type="range"
      value={value}
    />
  );
}

class SliderControl extends BaseControl<SliderControlProps> {
  render() {
    return (
      <AdsSlider
        onChange={this.onToggle}
        onMouseEnter={this.onMouseEnter}
        onMouseLeave={this.onMouseLeave}
        onRelease={this.onRelease}
        onStart={this.onStart}
        value={this.props.propertyValue}
      />
    );
  }

  onToggle = (value: number) => {
    this.updateProperty(this.props.propertyName, value);
    if (this.props.onChange) {
      this.props.onChange();
    }
  };

  onMouseEnter = () => {
    if (this.props.onMouseEnter) {
      this.props.onMouseEnter();
    }
  };

  onMouseLeave = () => {
    if (this.props.onMouseLeave) {
      this.props.onMouseLeave();
    }
  };

  onStart = () => {
    if (this.props.onStart) {
      this.props.onStart();
    }
  };

  onRelease = () => {
    if (this.props.onRelease) {
      this.props.onRelease();
    }
  };

  static getControlType() {
    return "SLIDER";
  }

  static canDisplayValueInUI(config: ControlData, value: any): boolean {
    return value === "true" || value === "false";
  }
}

export interface SliderControlProps extends ControlProps {
  onChange?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onRelease?: () => void;
  onStart?: () => void;
}

export default SliderControl;

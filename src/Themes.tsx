import { List } from "immutable";
import * as React from "react";
import { Button, Row } from "./components/Button";
import SvgIcon from "./components/SvgIcon";
import { Theme } from "./types/Theme";
import { Channel } from '@storybook/channels';
import { API } from '@storybook/api';

export interface ThemeProps {
  channel: Channel;
  api: API;
  active: boolean;
}

interface ButtonProps {
  onSelectTheme: (theme: Theme) => void;
  theme: Theme;
  onOpenModal: () => void;
  themes: List<Theme>;
}

const BaseComponent: React.FunctionComponent<ButtonProps> = ({
  onSelectTheme,
  themes,
  theme,
  onOpenModal,
}) => (
  /* tslint:disable:jsx-no-multiline-js jsx-no-lambda*/
  <Row>
    {themes
      .map((th, i) => (
        <Button
          isSelected={th === theme}
          key={i}
          onClick={() => onSelectTheme(th)}
        >
          <span>{th.name}</span>
          <SvgIcon name="info" onClick={() => onOpenModal()} />
        </Button>
      ))
      .toArray()}
  </Row>
);

export const Themes: React.FunctionComponent<ThemeProps> = ({
  channel,
  active,
}) => {
  const [theme, setTheme] = React.useState(null);
  const [themes, setThemes] = React.useState(List());

  const onReceiveThemes = (newThemes: Theme[]) => {
    // tslint:disable-next-line: no-shadowed-variable
    const themes = List(newThemes);
    const themeSaved = JSON.parse(localStorage.getItem("themeprovider-storybook-selected-theme"));
    setThemes(themes);
    if (themes.count() > 0) {
      // tslint:disable-next-line: no-shadowed-variable
      const theme = themes.find((t) => t.name === themeSaved) || themes.first();
      setTheme(theme);

      if (theme.backgroundColor && window?.location?.search.includes("story")) {
        document.getElementById("storybook-preview-iframe").style.background = theme.backgroundColor;
      }

      channel.emit("selectTheme", theme);
    }
  };

  const onSelectTheme = (customTheme: Theme) => {
    setTheme(customTheme);

    if (customTheme.backgroundColor && window?.location?.search.includes("story")) {
      document.getElementById("storybook-preview-iframe").style.background = customTheme.backgroundColor;
      localStorage.setItem("themeprovider-storybook-selected-theme", JSON.stringify(customTheme.name));
    }

    channel.emit("selectTheme", customTheme);
  };

  const onOpenModal = () => {
    channel.emit("openModal", true);
  };

  // When swiching to docs page we disable background color, because it's a more complex design
  // On a future release of storybook,
  // we hope they enable an internal naming(id, or theme) for setting only the background of each box.
  const onHandleDocsPage = ({ viewMode }) => {
    if (viewMode === "docs") {
      document.getElementById("storybook-preview-iframe").style.background = "#FFFFFF";
    }
  }

  React.useEffect(() => {
    channel.on("setThemes", onReceiveThemes);
    channel.on("setCurrentStory", onHandleDocsPage);
    return () => {
      channel.removeListener("setThemes", onReceiveThemes);
      channel.removeListener("setCurrentStory", onHandleDocsPage);
    };
  }, []);

  return theme && active ? (
    <BaseComponent
      onOpenModal={onOpenModal}
      onSelectTheme={onSelectTheme}
      themes={themes}
      theme={theme}
    />
  ) : null;
};

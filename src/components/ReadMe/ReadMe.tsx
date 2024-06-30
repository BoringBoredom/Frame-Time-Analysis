import {
  Stack,
  Divider,
  Anchor,
  Code,
  Tooltip,
  Text,
  Button,
  Accordion,
} from "@mantine/core";
import s from "./ReadMe.module.css";
import { IconDownload } from "@tabler/icons-react";

export default function ReadMe() {
  return (
    <Stack className={s.width}>
      <Text size="xl" className={s.title}>
        Read Me
      </Text>
      <Divider />
      <Text>
        Press the Upload button in the upper-right corner to upload benchmarks.
      </Text>
      <Text>
        After you upload files, you can export a screenshot of the whole page
        (including off-screen) to your clipboard or save it as a PNG with the
        buttons below the Upload one.
      </Text>
      <Text>
        Supported formats:
        <br />- CSV (
        <Anchor
          href="https://github.com/GameTechDev/PresentMon"
          target="_blank"
        >
          PresentMon
        </Anchor>
        ,{" "}
        <Anchor
          href="https://www.nvidia.com/en-us/geforce/technologies/frameview/"
          target="_blank"
        >
          FrameView
        </Anchor>
        ,{" "}
        <Anchor href="https://github.com/CXWorld/CapFrameX" target="_blank">
          CapFrameX
        </Anchor>
        ,{" "}
        <Anchor href="https://github.com/GPUOpen-Tools/ocat" target="_blank">
          OCAT
        </Anchor>
        ,{" "}
        <Anchor
          href="https://github.com/flightlessmango/MangoHud"
          target="_blank"
        >
          MangoHud
        </Anchor>
        , GeForce Experience)
        <br />- JSON (
        <Anchor href="https://github.com/CXWorld/CapFrameX" target="_blank">
          CapFrameX
        </Anchor>
        )
      </Text>
      <Text>
        Panning and Zooming:
        <br />- Pan: hold down left click and move mouse
        <br />- Zoom: hold down CTRL and scroll up/down
        <br />- Area selection: hold down both CTRL and left click to draw a
        rectangle
        <br />- Reset: double-click
      </Text>
      <Text>
        Click on individual benchmarks in the chart legends to hide them.
      </Text>
      <Text>
        Report bugs{" "}
        <Anchor
          href="https://github.com/BoringBoredom/Frame-Time-Analysis/issues"
          target="_blank"
        >
          here
        </Anchor>
        .
      </Text>
      <Divider />
      <Text>
        PresentMon is the underlying software most benchmarking programs are
        based on.
      </Text>
      <Button
        component="a"
        href="https://github.com/BoringBoredom/Frame-Time-Analysis/raw/main/presentmon/presentmon.zip"
        leftSection={<IconDownload />}
      >
        PresentMon
      </Button>
      <Text>
        Run <Code>Run.bat</Code> as Administrator and press F10 to start/stop
        benchmarking.
      </Text>
      <Accordion chevronPosition="left">
        <Accordion.Item value="main">
          <Accordion.Control>
            {"What's included in the download?"}
          </Accordion.Control>
          <Accordion.Panel>
            <Stack>
              <Text>
                This package is automatically generated from the{" "}
                <Anchor
                  href="https://github.com/GameTechDev/PresentMon"
                  target="_blank"
                >
                  PresentMon
                </Anchor>{" "}
                release page.
              </Text>
              <Code block>
                presentmon
                <br />
                ├── captures
                <br />
                ├── presentmon.exe
                <br />
                └── Run.bat
              </Code>
              <Text>Run.bat:</Text>
              <Tooltip label="Click to copy to clipboard">
                <Code
                  block
                  className={s.cursor}
                  onClick={() => {
                    void navigator.clipboard.writeText(
                      `pushd %~dp0\ncd captures\n..\\presentmon.exe --multi_csv --no_console_stats --hotkey "F10"`
                    );
                  }}
                >
                  pushd %~dp0
                  <br />
                  cd captures
                  <br />
                  ..\presentmon.exe --multi_csv --no_console_stats --hotkey
                  &quot;F10&quot;
                </Code>
              </Tooltip>
              <Text>
                <Code>Run.bat</Code> is just a sample file.{" "}
                <Anchor
                  href="https://github.com/GameTechDev/PresentMon/blob/main/README-ConsoleApplication.md"
                  target="_blank"
                >
                  Here
                </Anchor>{" "}
                is the full list of command line options.
              </Text>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Stack>
  );
}

import { Stack, Divider, Anchor, Code, Tooltip, Text } from "@mantine/core";
import s from "./ReadMe.module.css";

export default function ReadMe() {
  return (
    <Stack>
      <Text size="xl" className={s.title}>
        Read Me
      </Text>
      <Divider />
      <Text>
        Press the Upload icon in the upper-right corner to upload benchmarks
        (max. 14).
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
        <br />- Pan: hold down left click and move mouse inside a chart
        <br />- Zoom: hold down CTRL and scroll inside a chart
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
      <Text>
        Download{" "}
        <Anchor
          href="https://github.com/GameTechDev/PresentMon/releases/latest"
          target="_blank"
        >
          PresentMon
        </Anchor>{" "}
        and create the following folder structure:
      </Text>
      <Code block>
        parent folder
        <br />
        ├── captures
        <br />
        ├── PresentMon.exe
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
              `@pushd %~dp0\n@cd captures\n@..\\PresentMon.exe -multi_csv -no_top -hotkey "f10"`
            );
          }}
        >
          @pushd %~dp0
          <br />
          @cd captures
          <br />
          @..\PresentMon.exe -multi_csv -no_top -hotkey &quot;f10&quot;
        </Code>
      </Tooltip>
      <Text>
        This is just a sample file.{" "}
        <Anchor
          href="https://github.com/GameTechDev/PresentMon/blob/main/README-ConsoleApplication.md"
          target="_blank"
        >
          Here
        </Anchor>{" "}
        is the full list of options.
      </Text>
      <Text>
        Run <span className={s.bold}>Run.bat</span> as Administrator.
      </Text>
    </Stack>
  );
}

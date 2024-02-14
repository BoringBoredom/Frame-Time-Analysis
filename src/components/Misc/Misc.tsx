import {
  Stack,
  Divider,
  NativeSelect,
  Button,
  FileButton,
  Text,
} from "@mantine/core";
import { IconTrash, IconUpload } from "@tabler/icons-react";
import s from "./Misc.module.css";
import { saveAs } from "file-saver";
import React from "react";

async function aggregate(files: File[], resetRef: React.RefObject<() => void>) {
  let first = true;
  let content = "";
  let indicator: "frametime" | "msbetweenpresents";

  for (const file of files) {
    const text = await file.text();
    const lines = text.split("\n");

    if (first) {
      for (const line of lines) {
        const lowerCaseLine = line.toLowerCase();

        if (lowerCaseLine.includes("cpuscheduler")) {
          indicator = "frametime";
          break;
        }

        if (lowerCaseLine.includes("msbetweenpresents")) {
          indicator = "msbetweenpresents";
          break;
        }
      }

      content += text;
      first = false;
    } else {
      for (const [index, line] of lines.entries()) {
        const lowerCaseLine = line.toLowerCase();

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        if (lowerCaseLine.includes(indicator!)) {
          content += lines.slice(index + 1).join("\n");
          break;
        }
      }
    }

    if (lines[lines.length - 1] !== "") {
      content += "\n";
    }
  }

  if (content) {
    saveAs(new Blob([content]), "aggregated.csv");
  }

  resetRef.current?.();
}

export default function Misc({
  chartsPerRow,
  setChartsPerRow,
}: {
  chartsPerRow: number;
  setChartsPerRow: React.Dispatch<React.SetStateAction<number>>;
}) {
  const resetRef = React.useRef<() => void>(null);

  return (
    <Stack className={s.width}>
      <Text size="xl" className={s.title}>
        Miscellaneous
      </Text>
      <Divider />
      <NativeSelect
        label="Charts Per Row"
        data={["1", "2", "3"]}
        value={chartsPerRow}
        onChange={(ev) => {
          setChartsPerRow(parseInt(ev.target.value, 10));
        }}
      />
      <Button
        leftSection={<IconTrash />}
        color="red"
        onClick={() => {
          localStorage.clear();
          location.reload();
        }}
      >
        RESET ALL SETTINGS
      </Button>
      <Divider />
      <Text className={s.centerText}>Merge multiple CSV files</Text>
      <FileButton
        resetRef={resetRef}
        multiple
        accept=".csv"
        onChange={(files) => {
          void aggregate(files, resetRef);
        }}
      >
        {(props) => (
          <Button {...props} leftSection={<IconUpload />}>
            Aggregate
          </Button>
        )}
      </FileButton>
    </Stack>
  );
}

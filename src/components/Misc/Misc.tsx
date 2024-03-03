import {
  Stack,
  Divider,
  NativeSelect,
  Button,
  FileButton,
  Text,
  NumberInput,
} from "@mantine/core";
import { IconTrash, IconUpload } from "@tabler/icons-react";
import s from "./Misc.module.css";
import { saveAs } from "file-saver";
import React from "react";
import { sortOptions } from "../static";

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
  sortBy,
  setSortBy,
  colorRepeat,
  setColorRepeat,
}: {
  chartsPerRow: number;
  setChartsPerRow: React.Dispatch<React.SetStateAction<number>>;
  sortBy: (typeof sortOptions)[number];
  setSortBy: React.Dispatch<React.SetStateAction<(typeof sortOptions)[number]>>;
  colorRepeat: number;
  setColorRepeat: React.Dispatch<React.SetStateAction<number>>;
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
      <NativeSelect
        label="Sort By"
        data={sortOptions}
        value={sortBy}
        onChange={(ev) => {
          setSortBy(ev.target.value as (typeof sortOptions)[number]);
        }}
      />
      <NumberInput
        label="Repeat each color __ times"
        value={colorRepeat}
        onChange={(value) => {
          if (typeof value === "number") {
            setColorRepeat(value);
          }
        }}
        min={0}
        max={100}
        clampBehavior="strict"
        allowNegative={false}
        allowDecimal={false}
        stepHoldDelay={250}
        stepHoldInterval={1}
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

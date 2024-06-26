import { ActionIcon, FileButton, Stack, Tooltip } from "@mantine/core";
import { IconDownload, IconCopy, IconUpload } from "@tabler/icons-react";
import { handleUpload } from "../scripts";
import s from "./Buttons.module.css";
import React from "react";
import type { Data } from "../types";
import html2canvas from "html2canvas";
import { saveAs } from "file-saver";
import type { initialColors, sortOptions } from "../static";

function exportPage(download: boolean) {
  void html2canvas(document.body, {
    scrollY: 0,
    ignoreElements: (element) =>
      element.id === "button-container" ||
      element.tagName === "NOSCRIPT" ||
      !!element.getAttribute("data-portal"),
    onclone: (document) =>
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (document.getElementById("watermark")!.style.visibility = "visible"),
  }).then((canvas) => {
    canvas.toBlob((blob) => {
      if (blob) {
        if (download) {
          saveAs(blob, "export.png");
        } else {
          void navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob,
            }),
          ]);
        }
      }
    });
  });
}

export default function Buttons({
  data,
  setData,
  sortBy,
  colors,
  colorRepeat,
}: {
  data: Data;
  setData: React.Dispatch<React.SetStateAction<Data>>;
  sortBy: (typeof sortOptions)[number];
  colors: typeof initialColors;
  colorRepeat: number;
}) {
  const resetRef = React.useRef<() => void>(null);

  return (
    <Stack className={s.buttons} id="button-container">
      <FileButton
        resetRef={resetRef}
        multiple
        accept=".csv,.json"
        onChange={(files) => {
          void handleUpload(
            files,
            data,
            setData,
            sortBy,
            resetRef,
            colors,
            colorRepeat
          );
        }}
      >
        {(props) => (
          <Tooltip label="Upload files">
            <ActionIcon size="2rem" variant="subtle" color="gray" {...props}>
              <IconUpload size="2rem" />
            </ActionIcon>
          </Tooltip>
        )}
      </FileButton>
      {data.benches.length > 0 && (
        <>
          <Tooltip label="Export as PNG">
            <ActionIcon
              size="2rem"
              variant="subtle"
              color="gray"
              onClick={() => {
                exportPage(true);
              }}
            >
              <IconDownload size="2rem" />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Export to clipboard">
            <ActionIcon
              size="2rem"
              variant="subtle"
              color="gray"
              onClick={() => {
                exportPage(false);
              }}
            >
              <IconCopy size="2rem" />
            </ActionIcon>
          </Tooltip>
        </>
      )}
    </Stack>
  );
}

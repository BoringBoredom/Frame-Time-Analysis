import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

const codeBlockStyle = {
   padding: 1,
   margin: 1,
   bgcolor: (theme) => (theme.palette.mode === "dark" ? "#101010" : "#fff"),
   color: (theme) => (theme.palette.mode === "dark" ? "grey.300" : "grey.800"),
   border: "1px solid",
   borderColor: (theme) =>
      theme.palette.mode === "dark" ? "grey.800" : "grey.300",
   borderRadius: 2,
   fontWeight: "700"
};

const runBat = `@pushd %~dp0\n@cd captures\n@..\\PresentMon.exe -multi_csv -no_top -track_debug -hotkey "f9" -delay 1 -timed 120`;

export default function PresentMon() {
   return (
      <Stack spacing={1} divider={<Divider />}>
         <div className="title">PresentMon</div>
         <Stack spacing={3}>
            <div>
               PresentMon is the underlying software most benchmarking programs
               are based on.
            </div>
            <div>
               Download{" "}
               <Link
                  href="https://github.com/GameTechDev/PresentMon/releases"
                  target="_blank"
               >
                  PresentMon
               </Link>{" "}
               and create the following folder structure:
               <Box sx={{ ...codeBlockStyle }}>
                  parent folder<br></br>
                  ├── captures<br></br>
                  ├── PresentMon.exe<br></br>
                  └── Run.bat
               </Box>
            </div>
            <div>
               Run.bat:
               <Box sx={{ ...codeBlockStyle }}>
                  <IconButton
                     style={{ position: "relative", float: "right" }}
                     onClick={() => navigator.clipboard.writeText(runBat)}
                  >
                     <ContentCopyIcon fontSize="small" />
                  </IconButton>
                  @pushd %~dp0<br></br>
                  @cd captures<br></br>
                  @..\PresentMon.exe -multi_csv -no_top -track_debug -hotkey
                  "f9" -delay 1 -timed 120
               </Box>
               This is just a sample file.{" "}
               <Link
                  href="https://github.com/GameTechDev/PresentMon#command-line-options"
                  target="_blank"
               >
                  Here
               </Link>{" "}
               is the full list of options.
            </div>
            <div>
               Run <span style={{ fontWeight: 700 }}>Run.bat</span> as
               Administrator.
            </div>
         </Stack>
      </Stack>
   );
}

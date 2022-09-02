import IconButton from "@mui/material/IconButton";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { saveAs } from "file-saver";

async function handleFileChange(ev) {
   let first = true;
   let content = "";
   let indicator;

   for (const file of ev.target.files) {
      const text = await file.text();
      const textArray = text.split("\n");

      if (first) {
         for (const line of textArray) {
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
         for (const [index, line] of textArray.entries()) {
            const lowerCaseLine = line.toLowerCase();

            if (lowerCaseLine.includes(indicator)) {
               content += textArray.slice(index + 1).join("\n");
               break;
            }
         }
      }

      if (textArray[textArray.length - 1] !== "") {
         content += "\n";
      }
   }

   if (content) {
      saveAs(new Blob([content]), "aggregated.csv");
   }

   ev.target.value = "";
}

export default function Aggregation() {
   return (
      <Stack
         direction="row"
         spacing={1}
         divider={<Divider orientation="vertical" flexItem />}
         style={{ alignItems: "center" }}
      >
         <IconButton color="primary" component="label">
            <input
               type="file"
               accept=".csv"
               multiple
               hidden
               onChange={handleFileChange}
            />
            <FileUploadIcon fontSize="large" />
         </IconButton>
         <div>Merge multiple CSV files</div>
      </Stack>
   );
}

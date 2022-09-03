import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";

export default function ReadMe() {
   return (
      <Stack spacing={1} divider={<Divider />}>
         <div className="title">Read Me</div>
         <Stack spacing={3}>
            <div>
               Supported formats:
               <br></br>- CSV (
               <Link
                  href="https://github.com/GameTechDev/PresentMon"
                  target="_blank"
               >
                  PresentMon
               </Link>
               ,{" "}
               <Link
                  href="https://github.com/GPUOpen-Tools/ocat"
                  target="_blank"
               >
                  OCAT
               </Link>
               ,{" "}
               <Link
                  href="https://www.nvidia.com/en-us/geforce/technologies/frameview/"
                  target="_blank"
               >
                  FrameView
               </Link>
               ,{" "}
               <Link
                  href="https://github.com/CXWorld/CapFrameX"
                  target="_blank"
               >
                  CapFrameX
               </Link>
               ,{" "}
               <Link
                  href="https://github.com/flightlessmango/MangoHud"
                  target="_blank"
               >
                  MangoHud
               </Link>
               )<br></br>- JSON (
               <Link
                  href="https://github.com/CXWorld/CapFrameX"
                  target="_blank"
               >
                  CapFrameX
               </Link>
               )
            </div>
            <div>
               Report bugs{" "}
               <Link
                  href="https://github.com/BoringBoredom/Frame-Time-Analysis/issues"
                  target="_blank"
               >
                  here
               </Link>
               .
            </div>
         </Stack>
      </Stack>
   );
}

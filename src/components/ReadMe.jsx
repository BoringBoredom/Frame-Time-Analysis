import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Link from "@mui/material/Link";

export default function ReadMe() {
   return (
      <Stack spacing={1} divider={<Divider />}>
         <div className="title">Read Me</div>
         <Stack spacing={3}>
            <div>
               Press the Upload icon in the upper-right corner to upload
               benchmarks.
            </div>
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
               , GeForce Experience)<br></br>- JSON (
               <Link
                  href="https://github.com/CXWorld/CapFrameX"
                  target="_blank"
               >
                  CapFrameX
               </Link>
               )
            </div>
            <div>
               Panning and Zooming:
               <br></br> - Pan: hold down left click and move mouse inside a
               chart
               <br></br> - Zoom: hold down CTRL and scroll inside a chart
               <br></br> - disabled for both Scatter and both Line charts due to
               performance reasons
            </div>
            <div>
               Click on individual benchmarks in the chart legends to hide them.
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

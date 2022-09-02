import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import { useState } from "react";
import { SketchPicker } from "react-color";

function ColorPicker(props) {
   const [display, setDisplay] = useState(false);
   const { color, index, setColors } = props;

   return (
      <>
         <div
            style={{
               cursor: "pointer",
               width: "100%",
               height: "32px",
               background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
            }}
            onClick={() => setDisplay(true)}
         />
         {display && (
            <div style={{ position: "absolute", zIndex: "2" }}>
               <div
                  style={{
                     position: "fixed",
                     top: "0px",
                     right: "0px",
                     bottom: "0px",
                     left: "0px"
                  }}
                  onClick={() => setDisplay(false)}
               />
               <SketchPicker
                  color={color}
                  onChange={(ev) =>
                     setColors((previousColors) => {
                        previousColors[index] = ev.rgb;
                        return [...previousColors];
                     })
                  }
               />
            </div>
         )}
      </>
   );
}

export default function Colors(props) {
   const { colors, setColors } = props;

   return (
      <Stack spacing={1} divider={<Divider />}>
         <div className="title">Colors</div>
         <Stack spacing={1}>
            {colors.map((color, index) => (
               <ColorPicker
                  key={index}
                  color={color}
                  setColors={setColors}
                  index={index}
               />
            ))}
         </Stack>
      </Stack>
   );
}

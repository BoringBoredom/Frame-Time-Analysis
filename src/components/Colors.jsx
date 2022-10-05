/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Popover from "@mui/material/Popover";
import { useState } from "react";
import { SketchPicker } from "react-color";

function ColorPicker({ color, index, setColors }) {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <div
        style={{
          cursor: "pointer",
          width: "100%",
          height: "32px",
          background: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
        }}
        onClick={handleClick}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transitionDuration={1}
      >
        <SketchPicker
          color={color}
          onChange={(ev) =>
            setColors((previousState) => {
              const newState = JSON.parse(JSON.stringify(previousState));
              newState[index] = ev.rgb;
              return newState;
            })
          }
        />
      </Popover>
    </>
  );
}

export default function Colors({ colors, setColors }) {
  return (
    <Stack spacing={1} divider={<Divider />}>
      <div className="title">Colors</div>
      <Stack spacing={1}>
        {colors.map((color, index) => (
          <ColorPicker
            // eslint-disable-next-line react/no-array-index-key
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

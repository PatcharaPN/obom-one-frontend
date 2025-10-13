import { InputAdornment, IconButton, TextField } from "@mui/material";
import { Icon } from "@iconify/react";

const SearchBar = ({
  value,
  onChange,
  onClear,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}) => {
  return (
    <TextField
      label="ค้นหา (ชื่อหัวข้อ, บริษัท, ผู้ดูแล...)"
      variant="outlined"
      fullWidth
      size="medium"
      value={value}
      onChange={onChange}
      placeholder="พิมพ์เพื่อค้นหา..."
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Icon icon="mdi:magnify" />
          </InputAdornment>
        ),
        endAdornment: value && (
          <InputAdornment position="end">
            <IconButton onClick={onClear}>
              <Icon icon="mdi:close-circle" />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  );
};
export default SearchBar;

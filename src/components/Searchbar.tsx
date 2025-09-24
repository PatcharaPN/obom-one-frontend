import { Icon } from "@iconify/react";

export const Searchbar = () => {
  return (
    <div className="border w-60 h-10 rounded-lg flex items-center gap-2 p-2">
      <Icon icon={"mdi:search"} /> <p>Search...</p>
    </div>
  );
};

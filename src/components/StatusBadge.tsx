export const renderStatusBadge = (taskTypes?: string[]) => {
  return taskTypes?.map((status) => {
    switch (status) {
      case "งานใหม่":
        return (
          <div
            key={status}
            className="px-2 py-1 bg-[#FFF4E5] text-[#FF8C00] rounded-full text-sm"
          >
            งานใหม่
          </div>
        );
      case "งานแก้ไข":
        return (
          <div
            key={status}
            className="px-2 py-1 bg-[#E5F0FF] text-[#0066FF] rounded-full text-sm"
          >
            งานแก้ไข
          </div>
        );
      case "งานด่วน":
        return (
          <div
            key={status}
            className="px-2 py-1 bg-[#FFE5E5] text-[#FF0000] rounded-full text-sm"
          >
            งานด่วน
          </div>
        );
      case "งานเสีย":
        return (
          <div
            key={status}
            className="px-2 py-1 bg-[#FFF0E5] text-[#FF6600] rounded-full text-sm"
          >
            งานแก้ (เสีย/NG)
          </div>
        );
      default:
        return null;
    }
  });
};

type DashboardCardProps = {
  count: number;
  type: string;
};

const DashboardCard = ({ count, type }: DashboardCardProps) => {
  return (
    <div className="p-5 shadow-xl flex-1 h-60 border-2 rounded-2xl border-blue-500/50">
      <div>
        <p>{type}</p>
      </div>
      <div className="flex justify-center items-center h-full">
        {" "}
        <div className="flex flex-col justify-center items-center gap-2">
          {" "}
          <h1 className="text-7xl text-[#026CB4]">{count}</h1>
          <span className="">รายการ</span>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;

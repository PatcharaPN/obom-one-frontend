type DashboardCardProps = {
  count: number;
  type: string;
};

const DashboardCard = ({ count, type }: DashboardCardProps) => {
  return (
    <div
      className="
        relative p-6 rounded-3xl 
        bg-white/80 backdrop-blur-xl
        border border-blue-400/30 
        shadow-lg hover:shadow-xl
        transition-transform transform hover:-translate-y-1 hover:scale-[1.01]
        flex flex-col justify-between 
        min-h-[220px] w-full
      "
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          {type}
        </p>
        <span className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 animate-pulse" />
      </div>

      {/* Center Content */}
      <div className="flex flex-col justify-center items-center flex-1 gap-2">
        <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 text-transparent bg-clip-text drop-shadow-sm">
          {count}
        </h1>
        <span className="text-gray-600 text-sm md:text-base tracking-wide">
          รายการ
        </span>
      </div>

      {/* Decorative Bottom Line */}
      <div className="w-full h-1 rounded-full bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 opacity-70 mt-4" />
    </div>
  );
};

export default DashboardCard;

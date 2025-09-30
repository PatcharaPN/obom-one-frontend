interface DatePickerProps {
  date: string;
  setDate: (date: string) => void;
}

const DatePicker = ({ date, setDate }: DatePickerProps) => {
  return (
    <div>
      <input
        className="p-1.5 w-full rounded-sm border-gray-300 border"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
    </div>
  );
};

export default DatePicker;

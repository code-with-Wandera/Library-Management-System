export default function SearchInput({ value, setValue, placeholder }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className="input input-bordered w-full mb-4"
      value={value}
      onChange={(e) => setValue(e.target.value)}
    />
  );
}

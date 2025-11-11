import React from 'react';

interface TextAreaInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  label: string;
  placeholder: string;
  rows?: number;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({ value, onChange, label, placeholder, rows = 6 }) => {
  return (
    <div>
      <label htmlFor={label} className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <textarea
        id={label}
        rows={rows}
        className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 resize-y"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      ></textarea>
    </div>
  );
};

export default TextAreaInput;

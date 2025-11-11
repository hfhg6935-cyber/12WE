
import React from 'react';

interface TextAreaInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

const TextAreaInput: React.FC<TextAreaInputProps> = ({ value, onChange }) => {
  return (
    <div>
      <label htmlFor="text-input" className="block text-sm font-medium text-gray-300 mb-2">
        النص المراد تحويله
      </label>
      <textarea
        id="text-input"
        rows={6}
        className="w-full p-4 bg-gray-900 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition duration-200 resize-y"
        placeholder="اكتب شيئًا هنا..."
        value={value}
        onChange={onChange}
      ></textarea>
    </div>
  );
};

export default TextAreaInput;

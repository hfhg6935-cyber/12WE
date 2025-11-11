import React from 'react';

type Effect = 'none' | 'reverb' | 'echo';

interface EffectSelectorProps {
  selectedValue: Effect;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  label?: string;
}

const EffectSelector: React.FC<EffectSelectorProps> = ({ selectedValue, onChange, label = "اختر تأثيرًا صوتيًا" }) => {
  return (
    <div className="md:col-span-2">
      <label htmlFor="effect-selector" className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <select
          id="effect-selector"
          value={selectedValue}
          onChange={onChange}
          className="block w-full pr-4 pl-10 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 appearance-none text-white"
        >
          <option value="none">بدون تأثير</option>
          <option value="reverb">صدى واسع (Reverb)</option>
          <option value="echo">تكرار الصوت (Echo)</option>
        </select>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
};

export default EffectSelector;

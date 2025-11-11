import React from 'react';
import { VoiceOption } from '../constants';
import { Voice } from '../types';

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedValue: Voice;
  onChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ voices, selectedValue, onChange }) => {
  return (
    <div>
      <label htmlFor="voice-selector" className="block text-sm font-medium text-gray-300 mb-2">
        اختر الصوت
      </label>
      <div className="relative">
        <select
          id="voice-selector"
          value={selectedValue}
          onChange={onChange}
          className="block w-full pr-4 pl-10 py-3 bg-gray-700 border border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 appearance-none text-white"
        >
          {voices.map((voice) => (
            <option key={voice.value} value={voice.value}>
              {voice.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-400">
           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>
  );
};

export default VoiceSelector;
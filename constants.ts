import { Voice } from './types';

export interface VoiceOption {
  value: Voice;
  label: string;
}

export const VOICES: VoiceOption[] = [
  { value: Voice.KORE, label: 'صوت أنثوي واضح (كور)' },
  { value: Voice.PUCK, label: 'صوت ذكوري ودود (باك)' },
  { value: Voice.CHARON, label: 'صوت ذكوري رسمي (شارون)' },
  { value: Voice.FENRIR, label: 'صوت عميق وجذاب (فنرير)' },
  { value: Voice.ZEPHYR, label: 'صوت هادئ ومريح (زفير)' },
];
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sleep(ms: number) {
  // eslint-disable-next-line promise/avoid-new
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getContrastColor(hexcolor: string) {
  if (!hexcolor) {
    return '#000000'; // デフォルトのアイコン色
  }

  // #から始まる場合は除去
  const color = hexcolor.startsWith('#') ? hexcolor.slice(1) : hexcolor;

  // RGB値を取得
  const r = Number.parseInt(color.slice(0, 2), 16);
  const g = Number.parseInt(color.slice(2, 4), 16);
  const b = Number.parseInt(color.slice(4, 6), 16);

  // 輝度を計算
  const y = (r * 299 + g * 587 + b * 114) / 1000;

  // 輝度に基づいてコントラスト色を決定 (閾値は128)
  return y >= 128 ? '#000000' : '#FFFFFF';
}

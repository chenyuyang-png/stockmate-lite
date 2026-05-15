// 數字格式化工具

export function formatPrice(value: number | undefined, currency = "TWD"): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  const decimals = value >= 1000 ? 0 : 2;
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2,
  });
}

export function formatPercent(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function formatChange(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

// 用「億」「兆」表示大數字（中文習慣）
export function formatLargeNumber(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e12) return `${(value / 1e12).toFixed(2)}兆`;
  if (abs >= 1e8) return `${(value / 1e8).toFixed(2)}億`;
  if (abs >= 1e4) return `${(value / 1e4).toFixed(1)}萬`;
  return value.toLocaleString();
}

export function formatVolume(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

// 漲跌顏色（台股慣例：紅漲綠跌）
export function changeColor(value: number | undefined): string {
  if (value === undefined || value === 0) return "text-gray-500";
  return value > 0 ? "text-red-600" : "text-green-600";
}

export function changeBg(value: number | undefined): string {
  if (value === undefined || value === 0) return "bg-gray-100";
  return value > 0 ? "bg-red-50" : "bg-green-50";
}

// frontend/src/theme/chartTheme.ts
import { Colors } from './colors';

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

const accentRgb = hexToRgb(Colors.accentPrimary);
const textSecondaryRgb = hexToRgb(Colors.textSecondary);

export function getLineChartConfig() {
  return {
    backgroundGradientFrom: Colors.backgroundSecondary,
    backgroundGradientTo: Colors.backgroundSecondary,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${accentRgb},${opacity})`,
    labelColor: (opacity = 1) => `rgba(${textSecondaryRgb},${opacity})`,
    propsForBackgroundLines: {
      stroke: Colors.divider,
      strokeDasharray: '',
    },
    propsForDots: {
      r: '4',
      fill: Colors.accentPrimary,
    },
  };
}

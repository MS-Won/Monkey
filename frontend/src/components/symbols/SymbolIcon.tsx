// frontend/src/components/symbols/SymbolIcon.tsx
import React from 'react';
import { symbolRegistry } from './registry';
import GenericIcon from './icons/GenericIcon';
import { IconProps } from './types';

type SymbolIconProps = IconProps & {
  keyword: string;
};

export default function SymbolIcon({ keyword, ...rest }: SymbolIconProps) {
  const IconComponent = symbolRegistry[keyword] ?? GenericIcon;
  return <IconComponent {...rest} />;
}

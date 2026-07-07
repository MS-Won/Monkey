// frontend/src/components/symbols/registry.ts
// Keyword -> icon mapping. Keys mirror ResultScreen.tsx's extractMainKeyword() vocabulary.
// Tier 1 (hand-crafted): 돼지·뱀·물·불·돈·집·가족·아이/아기
// Tier 2/3: not yet crafted, fall back to GenericIcon via SymbolIcon's lookup miss.
import { ComponentType } from 'react';
import { IconProps } from './types';
import PigIcon from './icons/PigIcon';
import SnakeIcon from './icons/SnakeIcon';
import WaterIcon from './icons/WaterIcon';
import FireIcon from './icons/FireIcon';
import MoneyIcon from './icons/MoneyIcon';
import HouseIcon from './icons/HouseIcon';
import FamilyIcon from './icons/FamilyIcon';
import ChildIcon from './icons/ChildIcon';
import GoldIcon from './icons/GoldIcon';
import AncestorIcon from './icons/AncestorIcon';
import FriendIcon from './icons/FriendIcon';
import SchoolIcon from './icons/SchoolIcon';
import CompanyIcon from './icons/CompanyIcon';
import SeaIcon from './icons/SeaIcon';
import MountainIcon from './icons/MountainIcon';
import RiverIcon from './icons/RiverIcon';

export const symbolRegistry: Record<string, ComponentType<IconProps>> = {
  // Tier 1
  돼지: PigIcon,
  뱀: SnakeIcon,
  물: WaterIcon,
  불: FireIcon,
  돈: MoneyIcon,
  집: HouseIcon,
  가족: FamilyIcon,
  아이: ChildIcon,
  아기: ChildIcon,
  // Tier 2
  금: GoldIcon,
  조상: AncestorIcon,
  친구: FriendIcon,
  학교: SchoolIcon,
  회사: CompanyIcon,
  바다: SeaIcon,
  산: MountainIcon,
  강: RiverIcon,
};

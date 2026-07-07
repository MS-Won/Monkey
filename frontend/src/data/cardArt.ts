// frontend/src/data/cardArt.ts
// 아키타입 카드 id → 일러스트(정적 PNG) 매핑.
// 자산은 scripts/gen-card-art.py로 1회 생성해 frontend/assets/images/cards/에 고정.
// Metro는 require 경로가 정적 리터럴이어야 하므로 30장을 명시적으로 나열한다.
import type { ImageSourcePropType } from 'react-native';

export const CARD_ART: Record<number, ImageSourcePropType> = {
  1: require('../../assets/images/cards/01.png'),
  2: require('../../assets/images/cards/02.png'),
  3: require('../../assets/images/cards/03.png'),
  4: require('../../assets/images/cards/04.png'),
  5: require('../../assets/images/cards/05.png'),
  6: require('../../assets/images/cards/06.png'),
  7: require('../../assets/images/cards/07.png'),
  8: require('../../assets/images/cards/08.png'),
  9: require('../../assets/images/cards/09.png'),
  10: require('../../assets/images/cards/10.png'),
  11: require('../../assets/images/cards/11.png'),
  12: require('../../assets/images/cards/12.png'),
  13: require('../../assets/images/cards/13.png'),
  14: require('../../assets/images/cards/14.png'),
  15: require('../../assets/images/cards/15.png'),
  16: require('../../assets/images/cards/16.png'),
  17: require('../../assets/images/cards/17.png'),
  18: require('../../assets/images/cards/18.png'),
  19: require('../../assets/images/cards/19.png'),
  20: require('../../assets/images/cards/20.png'),
  21: require('../../assets/images/cards/21.png'),
  22: require('../../assets/images/cards/22.png'),
  23: require('../../assets/images/cards/23.png'),
  24: require('../../assets/images/cards/24.png'),
  25: require('../../assets/images/cards/25.png'),
  26: require('../../assets/images/cards/26.png'),
  27: require('../../assets/images/cards/27.png'),
  28: require('../../assets/images/cards/28.png'),
  29: require('../../assets/images/cards/29.png'),
  30: require('../../assets/images/cards/30.png'),
};

export function getCardArt(id: number): ImageSourcePropType | undefined {
  return CARD_ART[id];
}

// frontend/src/data/cardArt.ts
// 아키타입 카드 id → 일러스트(정적 WebP) 매핑.
// 자산은 scripts/sync-card-art.py가 무손실 마스터(img/NN_Name.png)에서 생성한다.
// WebP인 이유는 그 스크립트 주석 참조 — PNG 30장이 94MB로 AAB의 대부분이었다.
// Metro는 require 경로가 정적 리터럴이어야 하므로 30장을 명시적으로 나열한다.
import type { ImageSourcePropType } from 'react-native';

export const CARD_ART: Record<number, ImageSourcePropType> = {
  1: require('../../assets/images/cards/01.webp'),
  2: require('../../assets/images/cards/02.webp'),
  3: require('../../assets/images/cards/03.webp'),
  4: require('../../assets/images/cards/04.webp'),
  5: require('../../assets/images/cards/05.webp'),
  6: require('../../assets/images/cards/06.webp'),
  7: require('../../assets/images/cards/07.webp'),
  8: require('../../assets/images/cards/08.webp'),
  9: require('../../assets/images/cards/09.webp'),
  10: require('../../assets/images/cards/10.webp'),
  11: require('../../assets/images/cards/11.webp'),
  12: require('../../assets/images/cards/12.webp'),
  13: require('../../assets/images/cards/13.webp'),
  14: require('../../assets/images/cards/14.webp'),
  15: require('../../assets/images/cards/15.webp'),
  16: require('../../assets/images/cards/16.webp'),
  17: require('../../assets/images/cards/17.webp'),
  18: require('../../assets/images/cards/18.webp'),
  19: require('../../assets/images/cards/19.webp'),
  20: require('../../assets/images/cards/20.webp'),
  21: require('../../assets/images/cards/21.webp'),
  22: require('../../assets/images/cards/22.webp'),
  23: require('../../assets/images/cards/23.webp'),
  24: require('../../assets/images/cards/24.webp'),
  25: require('../../assets/images/cards/25.webp'),
  26: require('../../assets/images/cards/26.webp'),
  27: require('../../assets/images/cards/27.webp'),
  28: require('../../assets/images/cards/28.webp'),
  29: require('../../assets/images/cards/29.webp'),
  30: require('../../assets/images/cards/30.webp'),
};

export function getCardArt(id: number): ImageSourcePropType | undefined {
  return CARD_ART[id];
}

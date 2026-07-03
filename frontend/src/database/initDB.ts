import SQLite from 'react-native-sqlite-storage';

SQLite.DEBUG(true);
SQLite.enablePromise(false);

export const getDB = (): SQLite.SQLiteDatabase => {
  return SQLite.openDatabase({
    name: 'dreams.db',
    location: 'default',
  }) as unknown as SQLite.SQLiteDatabase;
};

export const initDB = () => {
  const db = getDB();

  db.transaction(tx => {
    tx.executeSql(
      `
      CREATE TABLE IF NOT EXISTS cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sentence TEXT,
        result TEXT,
        embedding TEXT
      );
      `,
      [],
      () => console.log('✅ cache 테이블 생성 완료'),
      error => {
        console.error('❌ cache 테이블 생성 실패:', error);
        return true;
      },
    );

    tx.executeSql(
      `
      CREATE TABLE IF NOT EXISTS dream_diary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        dream_text TEXT,
        interpretation TEXT,
        keyword TEXT,
        lucky_score INTEGER DEFAULT 0,
        created_at TEXT
      );
      `,
      [],
      () => console.log('✅ dream_diary 테이블 생성 완료'),
      error => {
        console.error('❌ dream_diary 테이블 생성 실패:', error);
        return true;
      },
    );

    addColumnIfNeeded(tx, 'dream_diary', 'dream_text', 'TEXT');
    addColumnIfNeeded(tx, 'dream_diary', 'interpretation', 'TEXT');
    addColumnIfNeeded(tx, 'dream_diary', 'keyword', 'TEXT');
    addColumnIfNeeded(tx, 'dream_diary', 'lucky_score', 'INTEGER DEFAULT 0');
    addColumnIfNeeded(tx, 'dream_diary', 'created_at', 'TEXT');

    tx.executeSql(
      `PRAGMA table_info(dream_diary);`,
      [],
      (_, result) => {
        console.log('📌 initDB dream_diary 테이블 구조 확인');

        for (let i = 0; i < result.rows.length; i++) {
          console.log(result.rows.item(i));
        }
      },
      error => {
        console.error('❌ dream_diary 구조 확인 실패:', error);
        return true;
      },
    );
  });
};

const addColumnIfNeeded = (
  tx: SQLite.Transaction,
  tableName: string,
  columnName: string,
  columnType: string,
) => {
  tx.executeSql(
    `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType};`,
    [],
    () => console.log(`✅ ${columnName} 컬럼 추가 완료`),
    error => {
      console.log(`ℹ️ ${columnName} 컬럼 추가 생략:`, error);
      return true;
    },
  );
};

export const saveDreamDiary = (
  dreamText: string,
  interpretation: string,
  keyword: string,
  luckyScore: number,
) => {
  const db = getDB();

  const safeDreamText = String(dreamText || '');
  const safeInterpretation = String(interpretation || '');
  const safeKeyword = String(keyword || '기타');
  const safeLuckyScore = Number.isFinite(luckyScore) ? luckyScore : 0;
  const createdAt = new Date().toISOString();

  console.log('📝 dream_diary 저장 시도:', {
    dreamTextLength: safeDreamText.length,
    interpretationLength: safeInterpretation.length,
    keyword: safeKeyword,
    luckyScore: safeLuckyScore,
    createdAt,
  });

  db.transaction(tx => {
    tx.executeSql(
      `PRAGMA table_info(dream_diary);`,
      [],
      (_, result) => {
        console.log('📌 저장 직전 dream_diary 테이블 구조 확인');

        for (let i = 0; i < result.rows.length; i++) {
          console.log(result.rows.item(i));
        }
      },
      error => {
        console.error('❌ 저장 직전 테이블 구조 확인 실패:', error);
        return true;
      },
    );

    tx.executeSql(
      `
      INSERT INTO dream_diary
      (dream_text, interpretation, keyword, lucky_score, created_at)
      VALUES (?, ?, ?, ?, ?);
      `,
      [
        safeDreamText,
        safeInterpretation,
        safeKeyword,
        safeLuckyScore,
        createdAt,
      ],
      (_, result) => {
        console.log('✅ dream_diary 저장 완료:', result.insertId);
      },
      error => {
        console.error('❌ dream_diary 저장 실패 실제 error:', error);
        console.error('❌ dream_diary 저장 실패 JSON:', JSON.stringify(error));
        return true;
      },
    );
  });
};
import SQLite from 'react-native-sqlite-storage';

// DB 인스턴스를 반환
export const getDB = (): SQLite.SQLiteDatabase => {
  return SQLite.openDatabase({ name: 'dreams.db', location: 'default' }) as unknown as SQLite.SQLiteDatabase;
};

// 앱 실행 시 테이블 생성
export const initDB = () => {
  const db = getDB();

  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sentence TEXT,
        result TEXT,
        embedding TEXT
      );`,
      [],
      () => console.log('✅ cache 테이블 생성 완료'),
      (_, error) => {
        console.error('❌ 테이블 생성 오류:', error);
        return true;
      }
    );
  });
};

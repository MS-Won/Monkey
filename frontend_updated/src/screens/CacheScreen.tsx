import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import SQLite from 'react-native-sqlite-storage';

interface CacheItem {
  id: number;
  sentence: string;
  result: string;
}

const CacheScreen = () => {
  const [cacheData, setCacheData] = useState<CacheItem[]>([]);

  useEffect(() => {
    const loadCache = async () => {
      const db = await SQLite.openDatabase({ name: 'dreams.db', location: 'default' });

      db.transaction((tx) => {
        tx.executeSql(
          'SELECT id, sentence, result FROM cache ORDER BY id DESC',
          [],
          (_, results) => {
            const rows = results.rows;
            const data: CacheItem[] = [];

            for (let i = 0; i < rows.length; i++) {
              data.push(rows.item(i));
            }

            setCacheData(data);
          },
          (_, error) => {
            console.error('❌ 캐시 조회 실패:', error);
            return true;
          }
        );
      });
    };

    loadCache();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔎 캐시된 꿈 해몽 목록</Text>
      <FlatList
        data={cacheData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.sentence}>💬 {item.sentence}</Text>
            <Text style={styles.result}>📘 {item.result}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default CacheScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  item: { marginBottom: 12, backgroundColor: '#f3f3f3', padding: 10, borderRadius: 8 },
  sentence: { fontWeight: 'bold', color: '#333' },
  result: { marginTop: 5, color: '#555' },
});

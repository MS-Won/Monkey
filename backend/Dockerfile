# Monkey 해몽 백엔드(Flask + KoNLPy/Okt) 컨테이너 이미지.
# Okt는 JVM이 필요하므로 JRE를 함께 설치한다.
FROM python:3.12-slim

# JRE 설치 + 아키텍처(amd64/arm64) 무관하게 JAVA_HOME 심링크 구성
RUN apt-get update \
    && apt-get install -y --no-install-recommends default-jre-headless \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s "$(dirname "$(dirname "$(readlink -f "$(which java)")")")" /usr/lib/jvm/current-java

ENV JAVA_HOME=/usr/lib/jvm/current-java
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# 의존성 먼저 설치(레이어 캐시)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 앱 소스(keyword_server.py, dream_lexicon.py, dream_dictionary.json 등)
COPY . .

# 호스트가 PORT를 주입(없으면 5001). OPENAI_API_KEY는 호스트 환경변수/Secret으로 주입.
# Okt(JVM) 메모리 고려로 workers=1, 첫 요청 시 JVM 로딩이 있어 timeout 넉넉하게.
ENV PORT=5001
EXPOSE 5001
CMD ["sh", "-c", "gunicorn -b 0.0.0.0:${PORT} keyword_server:app --workers 1 --timeout 120"]

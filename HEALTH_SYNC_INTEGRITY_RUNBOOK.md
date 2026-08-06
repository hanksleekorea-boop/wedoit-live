# 건강 동기화 무결성

- 같은 출처 record hash가 같은 payload로 재도착하면 중복으로 무시한다.
- 같은 hash인데 값·시간·종류가 다르면 덮어쓰지 않고 conflict로 격리한다.
- UTC instant와 원래 offset을 보존하고 일자 집계는 명시 offset으로 계산한다.
- Health Connect·HealthKit·Wear·수동 기록이 함께 있으면 목표별 대표 출처 하나를 사용자가 고르기 전 합산하지 않는다.
- 원본 삭제 change는 로컬 사본을 tombstone 처리하지만 건강 플랫폼 원본 삭제 API를 호출하지 않는다.
- changes token은 데이터 종류별로 분리하고 전체 page가 성공한 뒤에만 전진한다. 중간 실패는 이전 token을 유지한다.


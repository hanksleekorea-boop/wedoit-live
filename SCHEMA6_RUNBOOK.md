# schema 6 적용·readback·백업·롤백 계약

현재 공개 앱과 저장 구조의 schema 버전은 6이다. 이 절차는 PostgreSQL 호환 관리형 백엔드에
기존 7개 테이블·23개 RLS 정책·3개 보조 함수를 적용할 때 사용한다.

## 기본 순서

1. `pg_dump` custom 형식으로 `public` schema 전체를 백업한다.
2. 백업 성공 뒤에만 `backend-schema-v260a4.sql`을 `ON_ERROR_STOP=on`으로 적용한다.
3. 적용 성공 뒤에만 `schema6-readback-v260a10.sql`을 실행한다.
4. readback의 `ok=true`와 missing 배열 4개가 모두 비었을 때만 적용 완료로 기록한다.

## 안전 경계

- 기본 CLI는 계획만 출력하고 실제 DB에 쓰지 않는다.
- 적용은 `WEDOIT_SCHEMA6_APPROVAL=<change id>`가 정확히 일치할 때만 가능하다.
- 롤백은 자동 실행하지 않는다. 적용 실패가 곧바로 복원 실행으로 이어지면 새 데이터가 지워질 수 있다.
- 복원 명령은 별도 `WEDOIT_SCHEMA6_ROLLBACK_APPROVAL=<change id>:ROLLBACK` 승인 뒤 사람이 백업 파일·대상 DB를 다시 확인한 다음 실행한다.
- `PGPASSWORD` 등 자격증명 값은 결과 JSON·로그·문서에 출력하지 않는다.
- DB schema readback 성공은 앱 API·로그인·세 계정 RLS 성공이 아니다.

## 필요한 실행 환경

- `PGSERVICE`: 자격증명을 정상 PostgreSQL service 파일에서 읽는 연결 이름
- `WEDOIT_SCHEMA6_CHANGE_ID`: 변경 식별자
- `WEDOIT_SCHEMA6_BACKUP_DIR`: 작업 폴더 밖의 승인된 절대 백업 경로
- `psql`, `pg_dump`, `pg_restore`


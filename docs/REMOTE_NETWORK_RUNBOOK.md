# 원격 네트워크 실패·복구 시나리오

현재 공개 앱은 alpha8이고 이 계약은 미배포 alpha12 후보용이다. 기본 실행은 설정과 전용 테스트 고정물 승인이 없으면 `BLOCKED`, 네트워크 호출 0건이다.

## 봉인한 시나리오

1. `429`의 `Retry-After` 초/HTTP-date를 존중한 뒤 한 번만 재시도한다. 30초를 넘는 값은 자동 대기하지 않는다.
2. 전송 실패를 오프라인으로 기록하고 연결 복귀 뒤 같은 읽기를 다시 확인한다.
3. 오래된 버전의 쓰기가 `409`면 서버의 현재 버전을 읽어 전용 고정물에 `probeOnly` 재요청한다. 사용자 작업 ID는 유지하되 본문이 달라진 재시도는 별도 멱등 키를 쓴다.
4. 같은 멱등 키를 두 번 보내도 operation ID가 하나이고 두 번째 응답이 replay임을 확인한다.

## 실행 전 필수 조건

- HTTPS 공급자 중립 API와 짧은 수명 owner 테스트 토큰
- 운영 데이터와 분리된 전용 테스트 goal
- 서버 비밀키가 아닌 공개키
- `WEDOIT_NETWORK_PROBE_APPROVAL=RUN_DEDICATED_TEST_FIXTURE` 명시 승인
- 위 네 시나리오용 `/v1/network-probes/*` 테스트 경로

토큰·공개키 값은 결과 JSON과 오류에 남기지 않는다. 자동 백그라운드 실행은 없으며 실제 서버에서 통과하기 전까지 `actualBackend=false`, `remoteContract=false`다.

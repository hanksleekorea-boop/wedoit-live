# 원격 검증 단일 단계 실행 계약

alpha9→alpha12 검사를 한 명령으로 자동 연쇄하지 않는다. 한 번에 정확히 한 단계만 선택하며, 쓰기 단계는 서로 다른 승인값과 전용 테스트 고정물을 요구한다.

| 단계 | 기본 동작 | 승인 |
|---|---|---|
| `rls-read` | 세 계정·세 fixture 읽기 | 별도 쓰기 승인 없음 |
| `schema6-apply` | 백업→적용→readback | change ID와 동일한 적용 승인 |
| `safety-delivery` | 전용 신고·뮤트·차단 fixture | `RUN_DEDICATED_SAFETY_FIXTURE` |
| `network-recovery` | 429·복귀·409·멱등 fixture | `RUN_DEDICATED_TEST_FIXTURE` |

단계 선택이 없으면 plan-only, 설정이 없으면 `BLOCKED`, 호출 0건이다. schema 적용 승인과 rollback 승인은 계속 분리하며 자동 rollback·자동 다음 단계는 없다.

CLI: `node 70_TOOLS/remote_stage_probe_v260a15.mjs --stage <단계>`.

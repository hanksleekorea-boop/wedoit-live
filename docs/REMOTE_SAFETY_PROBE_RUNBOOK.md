# 원격 안전 전달 probe · v26.0-alpha.17

- 전용 테스트 계정과 폐기 가능한 post/actor/circle fixture에만 실행한다.
- `WEDOIT_SAFETY_PROBE_APPROVAL=RUN_DEDICATED_SAFETY_FIXTURE`가 정확히 일치해야 한다.
- endpoint, publishable key, access token, session/target actor ID, post ID, circle ID, 고유 run ID를 환경 변수로 넣는다.
- 실행: `node 70_TOOLS/remote_stage_probe_v260a17.mjs --stage safety-delivery`
- 순서: 신고 1회 → mute 설정/해제 → block 설정/해제 → ranking 동의/철회. 정상 종료 상태는 mute·block 해제, ranking opt-out이다.
- 승인이나 설정이 없으면 `BLOCKED`, 종료 코드 2, 네트워크 0회다. 중간 실패 시 fixture 상태를 운영자가 확인한다.
- 출력은 자격 증명을 포함하지 않는다. 실제 운영 사용자·콘텐츠에는 실행하지 않는다.

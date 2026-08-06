# Health Connect·Wear OS·HealthKit 최소 권한 계약

alpha14는 실제 건강 플랫폼 연결이 아닌 공급자 중립 계약이다. 실제 Android/iPhone/Watch 빌드와 기기가 없으므로 모든 대상환경 증거는 `false`, `D=UNKNOWN`이다.

## 공통 기본값

- 사용자가 건강 연동이 필요한 목표를 선택한 순간에만 권한을 요청한다.
- 걷기=걸음, 운동=운동 세션, 수면=수면처럼 목표에 직접 필요한 읽기 종류 하나만 시작한다.
- 쓰기, 전체 기록, 백그라운드 읽기는 기본 요청하지 않는다.
- 수동 기록·타이머·Health Connect·HealthKit·Wear 출처를 섞어 숨기지 않는다.
- 건강 이벤트는 항상 private이며 소셜·순위·위젯 자동 사용을 금지한다.
- 진단·치료·위험 판정 같은 의료 해석을 하지 않는다.

## Health Connect

- foreground read와 기본 30일 창으로 시작한다. 기록 전체·background read는 별도 기능과 별도 동의가 생길 때만 검토한다.
- 권한은 매 접근 전에 다시 확인하고, 동기화 토글을 끄면 즉시 중단한다.
- 권한 요청을 두 번 취소하면 반복 팝업 대신 Health Connect 설정 링크와 수동 입력을 제공한다.
- Play Console 선언 데이터 종류와 manifest 요청 종류를 정확히 맞춘다.

## Wear OS

- 걷기 목표는 `ACTIVITY_RECOGNITION`만 계획한다. 심박수·위치·백그라운드 센서는 alpha14 범위에서 요청하지 않는다.
- 운동 세션이 실제 제품 범위가 되기 전 Health Services를 상시 수집기로 사용하지 않는다.
- Wear OS 6/API 36의 새 health permission 전환은 정식 Wear 프로젝트에서 다시 검증한다.

## HealthKit

- HealthKit capability와 읽기 목적 문자열을 실제 Xcode 프로젝트에서 설정한 뒤에만 요청한다.
- 읽기 거부 여부를 앱이 직접 알 수 없으므로 빈 결과를 `거부됨`으로 표시하지 않고 `데이터 없음 또는 접근 없음`으로 표시한다.
- 시스템 Health 설정을 유일한 권한 정본으로 존중한다.

## 해제·삭제

연동 해제는 새 동기화를 멈추고 시스템 설정으로 안내한다. 원본 Health 저장소 데이터는 삭제하지 않는다. 사용자가 명시하면 위두잇으로 가져온 로컬 사본만 삭제한다.


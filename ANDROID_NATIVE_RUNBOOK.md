# Android 알림·위젯·재부팅 복구 경계

이 폴더는 실제 APK가 아니라 네이티브 통합용 참조 계약이다. alpha13 환경에는 Java·Gradle·Android SDK·ADB가 없어 `nativeBuild=false`, `physicalDevice=false`, `D=UNKNOWN`이다.

## 최소 권한과 전달

- Android 13(API 33)+는 사용자가 맥락을 이해한 뒤 `POST_NOTIFICATIONS`를 요청한다. 거부·미결정이면 앱 안 알림함으로 남긴다.
- 시스템 채널은 `action`, `direct-social`, `general-social`, `active-session`, `system` 다섯 개로 고정하고 목표마다 채널을 만들지 않는다.
- 시스템에서 채널을 끄거나 중요도를 바꾼 값을 앱이 되돌리지 않는다.
- `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`은 선언하지 않는다. 정각 요구도 `setWindow` 또는 WorkManager로 낮추고 근사 전달임을 알린다.
- 조용한 시간과 하루 상한을 통과해야만 시스템 알림 후보가 된다.

## 위젯 개인정보

- 기본은 목표명·수치 없이 `앱에서 다음 행동 보기`만 표시한다.
- 사용자가 고른 목표만 짧은 이름과 다음 행동을 표시한다.
- Health Connect 등 건강 수치는 동의된 목표라도 alpha13 위젯에 표시하지 않는다.
- 위젯은 다른 프로세스에서 다시 만들어질 수 있으므로 메모리가 아니라 저장된 최소 스냅샷을 읽는다.
- `wedoit_widget_info.xml`은 정식 프로젝트의 `res/xml/`에 둔다. 초기 레이아웃은 Glance가 제공하는 `glance_default_loading_layout`만 참조한다.

## 재부팅

- `BOOT_COMPLETED`만 받고 Direct Boot는 사용하지 않는다. 잠금 해제 전 자격증명 저장소를 읽지 않는다.
- receiver는 네트워크나 즉시 알림을 실행하지 않고, 저장된 사용자 승인 일정의 reconcile worker 하나만 등록한다.
- 참조 worker는 저장소가 통합되기 전 의도적으로 failure를 반환한다. 빈 성공을 재부팅 복구 성공으로 오인하지 않는다.
- 앱이 한 번도 실행되지 않았거나 백그라운드 제한 상태면 앱을 열 때 복구한다.
- WorkManager 작업은 schedule ID별 unique work로 만들고, 조용한 시간·상한·권한을 다시 판정한다.

## 실제 증거 승격 순서

1. 정식 Android 프로젝트에 참조 조각을 통합하고 Gradle 빌드 SHA를 기록한다.
2. 에뮬레이터에서 권한 허용·거부, 채널 차단, 위젯 재생성, 재부팅을 검사한다.
3. 물리 기기에서 Android 13+ 권한, 잠금화면, 제조사 백그라운드 제한, 재부팅 후 복구를 ADB fingerprint와 함께 기록한다.
4. 3번 전에는 웹/브라우저 통과를 Android 전달 성공으로 부르지 않는다.

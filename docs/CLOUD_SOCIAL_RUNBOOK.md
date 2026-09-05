# Google·Apple 로그인·클라우드 보호·친구 모임 운영 연결

현재 앱은 설정값이 없으면 완전한 로컬 모드로 동작한다. 실제 연결에는 Supabase 프로젝트와 Google 또는 Apple OAuth 운영 설정이 필요하다. 관리자 키, Google client secret, Apple 개인 키와 Apple client secret은 브라우저·Git·`runtime-config.json`에 넣지 않는다.

## 연결 순서

1. 출시 국가·저장 지역·보관 기간·삭제 책임과 비용을 운영자가 확정한다.
2. Supabase 프로젝트를 만들고 기존 `backend-schema-v260a4.sql` 뒤에 `backend-schema-v2710.sql`을 별도 승인·백업 후 적용한다.
3. Google Auth Platform에서 Web OAuth 클라이언트를 만든다. 범위는 `openid`, 이메일, 기본 프로필로 제한한다. 앱 공개 주소를 Authorized JavaScript origin과 Supabase redirect allow list에 넣고, Google redirect URI에는 Supabase Dashboard가 표시한 `/auth/v1/callback` 주소를 사용한다. Google client ID·secret은 Supabase Google provider 설정에만 넣는다.
4. Apple 로그인이 필요하면 Apple Developer Console에서 Sign in with Apple이 켜진 App ID, 웹용 Services ID, 서명 키를 만든다. Services ID의 웹 도메인은 Supabase 프로젝트 도메인, 반환 URL은 `https://<project-ref>.supabase.co/auth/v1/callback`으로 둔다. Apple Team ID·Services ID·생성한 client secret은 Supabase Apple provider 설정에만 넣고, `.p8` 개인 키는 안전한 비밀 보관소에만 둔다.
5. Apple 웹 OAuth client secret은 최대 6개월마다 갱신해야 한다. 만료 전 갱신 책임자와 알림을 운영 절차에 기록한다. Apple OAuth 웹 흐름에서는 사용자 이름을 안정적으로 받지 못할 수 있으므로 첫 화면은 이름을 필수값으로 가정하지 않는다.
6. `runtime-config.json`에는 Supabase HTTPS URL과 publishable/anon 키만 넣고, 연결한 공급자만 `googleLoginEnabled` 또는 `appleLoginEnabled`를 `true`로 바꾼다.
7. owner·member·stranger 세 전용 계정으로 비공개 보호본, 초대 만료·재사용, 모임 접근, 차단, 신고, 순위 기본 불참, 보호본 삭제를 검증한다.

## 데이터 유실 방지 계약

- 로그인 전 로컬 저장 저널·IndexedDB가 계속 정본이다.
- 로그인만으로는 기록을 업로드하지 않는다. 사용자가 `클라우드 보호 켜기`를 눌러야 한다.
- 보호본은 내용 해시별 불변 스냅샷이며 서버 자료가 기기 기록을 자동 덮어쓰지 않는다.
- 오프라인 전송은 기기 outbox에 남고 성공 응답 뒤에만 제거한다.
- 클라우드 보호본 복구는 JSON으로 내려받아 기존 복원 비교·취소·충돌 선택 절차를 거친다.
- 로그아웃은 기기 기록을 삭제하지 않는다. 사용자가 확인한 `클라우드 보호본 모두 삭제`는 본인 보호본과 전송 대기 큐만 지우며 기기 기록·친구 글·계정 자체를 삭제하지 않는다.
- 계정 탈퇴와 친구 글·프로필을 포함한 원격 계정 삭제는 Auth 관리자 권한과 운영자의 보관·법적 정책이 필요한 별도 경로다. 브라우저 공개 키로 이를 흉내 내지 않는다.

## 친구·경쟁 안전 계약

- 모임은 초대 링크 기본이며 링크는 7일 만료·해시 저장·사용 횟수 제한을 적용한다.
- 응원 글과 사용자가 누른 행동 1회만 공유한다. 목표명·메모·기분·전체 기록은 공유하지 않는다.
- 7일 순위는 구성원별 명시 동의가 기본이며 불참자는 행과 표본에서 제외한다.
- 차단 시 서로의 글·행동 집계가 보이지 않아야 한다. 신고는 서버에 실제 행으로 저장돼야 성공으로 표시한다.
- 실제 공개 전 신고 처리 책임자·응답 시간·삭제 정책을 확정한다.

공식 설정 참고: https://supabase.com/docs/guides/auth/social-login/auth-google · https://supabase.com/docs/guides/auth/social-login/auth-apple

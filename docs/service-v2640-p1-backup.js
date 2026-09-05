(()=>{
  "use strict";
  const VERSION="v26.4.0-p1-backup",FORMAT="wedoit.local-backup",FORMAT_VERSION=1,MAX_BYTES=10*1024*1024;
  const PREFERENCE_KEYS=Object.freeze([
    "wedoit.v264.trust","wedoit.v264.rhythm","wedoit.v264.pause","wedoit.v264.repeat-days",
    "wedoit.v264.timezone","wedoit.v264.date-corrections","wedoit.v264.record-notes",
    "wedoit.v264.week-plans","wedoit.v264.insight-sentences","wedoit.v264.reminder-schedule",
    "wedoit.v264.quiet-hours","wedoit.v270.pc-panel-width","wedoit.v270.pc-hidden-records",
    "wedoit.v271.account-preferences"
  ]);
  const SENSITIVE_KEY=/^(?:password|secret|token|accessToken|refreshToken|authorization|cookie|privateKey|apiKey|credential)$/i;
  const utf8Size=value=>new TextEncoder().encode(value).byteLength;
  const safeClone=value=>{
    if(Array.isArray(value))return value.map(safeClone);
    if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).filter(([key])=>!SENSITIVE_KEY.test(key)).map(([key,item])=>[key,safeClone(item)]));
    return value;
  };
  const readPreferences=(storage=localStorage)=>{
    const result={};
    for(const key of PREFERENCE_KEYS){
      try{const raw=storage.getItem(key);if(raw!==null)result[key]=safeClone(JSON.parse(raw))}catch(_){/* Invalid or blocked preferences are not copied. */}
    }
    return result;
  };
  const describe=backup=>{
    const state=backup.data.state,preferences=backup.data.localPreferences;
    return Object.freeze({goals:Array.isArray(state.goals)?state.goals.length:0,events:Array.isArray(state.events)?state.events.length:0,weeklyReviews:Array.isArray(state.weeklyReviews)?state.weeklyReviews.length:0,preferences:Object.keys(preferences).length});
  };
  const buildBackup=(app,{now=()=>new Date(),storage=localStorage}={})=>{
    const state=safeClone(JSON.parse(app.store.exportJson()));
    const backup={format:FORMAT,formatVersion:FORMAT_VERSION,appVersion:"v26.4.0",generatedAt:now().toISOString(),dataTypes:["goals","events","weeklyReviews","appPolicies","localPreferences"],data:{state,localPreferences:readPreferences(storage)}};
    backup.summary=describe(backup);
    return backup;
  };
  const serializeBackup=backup=>{
    const text=JSON.stringify(backup,null,2),bytes=utf8Size(text);
    if(bytes>MAX_BYTES){const error=new Error("backup-too-large");error.code="backup-too-large";error.bytes=bytes;throw error}
    return Object.freeze({text,bytes});
  };
  const parseBackup=text=>{
    const value=JSON.parse(String(text||""));
    if(value?.format!==FORMAT||value?.formatVersion!==FORMAT_VERSION||!value?.data?.state||!value?.data?.localPreferences)throw new Error("invalid-backup-format");
    return value;
  };
  const humanSize=bytes=>bytes<1024?`${bytes} B`:`${(bytes/1024).toFixed(bytes<10240?1:0)} KiB`;
  const copy=()=>document.documentElement.lang==="en"?{
    kicker:"A copy you keep",title:"Create a backup file",intro:"Download records and selected on-device settings as one versioned JSON file. Nothing is uploaded or changed.",
    format:"Format",generated:"Generated",types:"Data",button:"Download backup JSON",ready:"Ready to create only when you choose the button.",
    note:"Includes records and selected local settings. Account, authentication, social, cookie, and unlisted browser storage are excluded. Keep the file private because your own notes may be included.",
    done:(name,size)=>`${name} is ready in your browser downloads (${size}). Original records were not changed.`,large:"The backup is larger than 10 MiB, so no file was created.",failed:"This browser could not create the backup file.",
    summary:value=>`${value.goals} goals · ${value.events} records · ${value.weeklyReviews} weekly reviews · ${value.preferences} local settings`
  }:{
    kicker:"내가 보관하는 사본",title:"백업 파일 만들기",intro:"기록과 선택된 기기 안 설정을 버전이 있는 JSON 파일 하나로 내려받습니다. 어디에도 올리거나 원본을 바꾸지 않습니다.",
    format:"형식",generated:"생성 시각",types:"데이터",button:"백업 JSON 내려받기",ready:"버튼을 직접 눌렀을 때만 백업 파일을 만듭니다.",
    note:"기록과 선택된 로컬 설정만 포함합니다. 계정·인증·소셜·쿠키와 허용 목록 밖의 브라우저 저장값은 제외합니다. 직접 쓴 메모가 포함될 수 있으니 파일을 비공개로 보관하세요.",
    done:(name,size)=>`${name} 파일을 브라우저 다운로드에 준비했어요(${size}). 원본 기록은 바뀌지 않았습니다.`,large:"백업이 10MiB보다 커서 파일을 만들지 않았어요.",failed:"이 브라우저에서 백업 파일을 만들지 못했어요.",
    summary:value=>`목표 ${value.goals}개 · 기록 ${value.events}개 · 주간 검토 ${value.weeklyReviews}개 · 로컬 설정 ${value.preferences}종`
  };
  function mount(app){
    if(document.querySelector("#serviceBackupSection"))return true;
    const anchor=document.querySelector("#serviceQuietHoursSection")||document.querySelector("#serviceReminderScheduleSection"),host=document.querySelector("main.app");
    if(!anchor||!host)return false;
    const root=document.createElement("section");root.id="serviceBackupSection";root.className="section service-backup";root.dataset.serviceView="me";root.setAttribute("aria-live","polite");anchor.insertAdjacentElement("afterend",root);
    let status="";
    const render=()=>{
      const t=copy(),preview=buildBackup(app),summary=describe(preview);
      root.innerHTML=`<header><span class="service-section-kicker">${t.kicker}</span><h2>${t.title}</h2><p>${t.intro}</p></header><div class="service-backup-main"><dl><div><dt>${t.format}</dt><dd>${FORMAT} · v${FORMAT_VERSION}</dd></div><div><dt>${t.generated}</dt><dd>${new Date(preview.generatedAt).toLocaleString(document.documentElement.lang==="en"?"en-US":"ko-KR")}</dd></div><div><dt>${t.types}</dt><dd>${t.summary(summary)}</dd></div></dl><button id="serviceBackupDownload" class="primary" type="button">${t.button}</button></div><p id="serviceBackupStatus" class="service-backup-status" role="status">${status||t.ready}</p><p class="service-backup-note">${t.note}</p>`;
      root.querySelector("#serviceBackupDownload").addEventListener("click",()=>{
        try{const backup=buildBackup(app),serialized=serializeBackup(backup),blob=new Blob([serialized.text],{type:"application/json"}),link=document.createElement("a"),url=URL.createObjectURL(blob),stamp=backup.generatedAt.replace(/[:.]/g,"-");link.href=url;link.download=`wedoit-backup-${stamp}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status=t.done(link.download,humanSize(serialized.bytes))}catch(error){status=error?.code==="backup-too-large"?t.large:t.failed}render();
      });
    };
    window.addEventListener("wedoit:languagechange",render);app.store.subscribe(()=>queueMicrotask(render));render();document.documentElement.dataset.p1BackupReady="true";return true;
  }
  let tries=0;const timer=setInterval(()=>{tries+=1;const app=window.__WEDOIT__;if(app?.ready&&app.store&&mount(app)||tries>250)clearInterval(timer)},40);
  window.__WEDOIT_V264_P1_BACKUP__={version:VERSION,format:FORMAT,formatVersion:FORMAT_VERSION,maxBytes:MAX_BYTES,preferenceKeys:PREFERENCE_KEYS,buildBackup,serializeBackup,parseBackup,describe};
})();

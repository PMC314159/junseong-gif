(() => {
const $ = s => document.querySelector(s);
const num = (id, fallback = 0) => {
  const el = $(id.startsWith('#') ? id : `#${id}`);
  const v = el ? Number(el.value) : NaN;
  return Number.isFinite(v) ? v : fallback;
};
const txt = id => ($(id)?.textContent || '').trim();
const val = id => ($(id)?.value || '').trim();
const visible = el => !!el && getComputedStyle(el).display !== 'none' && !el.classList.contains('hidden');
const clamp = (n,a=0,b=1) => Math.min(b, Math.max(a,n));
const easeOutCubic = x => 1 - Math.pow(1 - clamp(x), 3);
    
function rr(ctx,x,y,w,h,r){
  r=Math.max(0,Math.min(r,Math.min(w,h)/2));
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
}

function localRect(el,rootRect){
  if(!el) return {x:0,y:0,w:0,h:0};
  const r=el.getBoundingClientRect();
  return {
    x:r.left-rootRect.left,
    y:r.top-rootRect.top,
    w:r.width,
    h:r.height
  };
}

function glass(ctx,r,alpha=.22,radius=24){
  ctx.save();
  rr(ctx,r.x,r.y,r.w,r.h,radius);
  ctx.fillStyle=`rgba(238,242,248,${alpha})`;
  ctx.fill();
  ctx.lineWidth=1;
  ctx.strokeStyle='rgba(255,255,255,.58)';
  ctx.stroke();
  ctx.restore();
}

function fitImage(ctx,img,r,fit='cover',zoom=1,ox=0,oy=0,radius=0){
  if(!img || !img.complete || !img.naturalWidth || !img.naturalHeight) return;

  const nw=img.naturalWidth;
  const nh=img.naturalHeight;

  const base=fit==='contain'
    ? Math.min(r.w/nw,r.h/nh)
    : Math.max(r.w/nw,r.h/nh);

  const dw=nw*base*zoom;
  const dh=nh*base*zoom;

  ctx.save();

  if(radius){
    rr(ctx,r.x,r.y,r.w,r.h,radius);
    ctx.clip();
  }

  ctx.drawImage(
    img,
    r.x+r.w/2+ox-dw/2,
    r.y+r.h/2+oy-dh/2,
    dw,
    dh
  );

  ctx.restore();
}

function font(ctx,size,weight=500){
  ctx.font=`${weight} ${size}px Inter, Pretendard, Arial, sans-serif`;
}

function drawText(
  ctx,
  text,
  x,
  y,
  size,
  weight,
  color='white',
  align='left',
  baseline='alphabetic'
){
  ctx.save();

  font(ctx,size,weight);

  ctx.fillStyle=color;
  ctx.textAlign=align;
  ctx.textBaseline=baseline;

  ctx.fillText(text,x,y);

  ctx.restore();
}
    
const measureCanvas=document.createElement('canvas');
const measureCtx=measureCanvas.getContext('2d');

function measureTextWidth(text,size=14,weight=500){
  if(!measureCtx){
    return (text||'').length*size*.58;
  }

  measureCtx.font=`${weight} ${size}px Inter, Pretendard, Arial, sans-serif`;

  return measureCtx.measureText(text||'').width;
}

function searchState(s,t,final=false){
  const full=s.text.search||'';
  const f=s.duration/5;

  const start=s.timeline.searchStart+.32*f;
  const available=Math.max(.25,s.duration-start-.18*f);

  const speed=Math.max(
    s.controls.typingSpeed||18,
    full.length/available
  );

  const count=final
    ? full.length
    : clamp(
        Math.floor(Math.max(0,t-start)*speed),
        0,
        full.length
      );

  const text=full.slice(0,count);

  return {
    text,
    width:Math.max(
      88,
      Math.min(
        300,
        Math.ceil(
          measureTextWidth(text,14,500)+86
        )
      )
    )
  };
}

function postState(s,t,final=false){
  const full=s.text.postTitle||'';
  const f=s.duration/5;

  const start=s.timeline.postStart+.28*f;
  const available=Math.max(.25,s.duration-start-.18*f);

  const speed=Math.max(
    s.controls.postTypingSpeed||16,
    full.length/available
  );

  const count=final
    ? full.length
    : clamp(
        Math.floor(Math.max(0,t-start)*speed),
        0,
        full.length
      );

  return full.slice(0,count);
}

/* =========================================
   D-DAY
   무조건 990부터 시작해서 999+까지
   ========================================= */

function ddayState(s,t,final=false){

  const sequence=[
    'D+990',
    'D+991',
    'D+992',
    'D+993',
    'D+994',
    'D+995',
    'D+996',
    'D+997',
    'D+998',
    'D+999',
    'D+999+'
  ];

  /* PNG 등 최종 장면 */
  if(final){
    return {
      text:'D+999+',
      phase:1,
      flipping:false
    };
  }

  const stepDur=
    s.controls.ddayFlipSpeed || .13;

  /*
    디데이 위젯 등장 후
    약간 기다렸다가 숫자 넘기기 시작
  */
  const startTime=
    s.timeline.ddayStart
    + .38*(s.duration/5);

  const elapsed=Math.max(
    0,
    t-startTime
  );

  const lastIndex=
    sequence.length-1;

  /*
    0 = 990
    1 = 991
    ...
    9 = 999
    10 = 999+
  */
  const index=Math.min(
    lastIndex,
    Math.floor(elapsed/stepDur)
  );

  /*
    현재 한 번의 숫자 flip이
    얼마나 진행됐는지 0~1
  */
  const phase=clamp(
    (elapsed-index*stepDur)/stepDur
  );

  return {
    text:sequence[index],
    phase,

    /*
      처음 990은 그냥 등장.
      이후 991부터 999+까지
      하나씩 flip.
    */
    flipping:index>0 && phase<1
  };
}
    
function drawBackground(ctx,s){
  ctx.fillStyle='#68707c';
  ctx.fillRect(0,0,s.w,s.h);

  const img=s.images.bg;

  if(
    img &&
    img.complete &&
    img.naturalWidth
  ){
    ctx.save();

    ctx.filter=
      `blur(${s.controls.bgBlur||0}px) saturate(.85) brightness(.78)`;

    fitImage(
      ctx,
      img,
      {
        x:0,
        y:0,
        w:s.w,
        h:s.h
      },
      'contain',
      s.controls.bgZoom,
      s.controls.bgX,
      s.controls.bgY,
      0
    );

    ctx.restore();
  }else{
    const g=
      ctx.createLinearGradient(
        0,
        0,
        s.w,
        s.h
      );

    g.addColorStop(
      0,
      '#cfd2d9'
    );

    g.addColorStop(
      .45,
      '#929aa6'
    );

    g.addColorStop(
      1,
      '#4d5159'
    );

    ctx.fillStyle=g;

    ctx.fillRect(
      0,
      0,
      s.w,
      s.h
    );
  }

  const ov=
    ctx.createLinearGradient(
      0,
      0,
      0,
      s.h
    );

  ov.addColorStop(
    0,
    'rgba(9,10,14,.18)'
  );

  ov.addColorStop(
    .6,
    'rgba(7,8,11,.26)'
  );

  ov.addColorStop(
    1,
    'rgba(6,7,10,.45)'
  );

  ctx.fillStyle=ov;

  ctx.fillRect(
    0,
    0,
    s.w,
    s.h
  );
}

function drawPhone(ctx,s){
  const p=s.rects.phone;
  const sc=s.rects.screen;

  ctx.save();

  rr(
    ctx,
    p.x,
    p.y,
    p.w,
    p.h,
    51
  );

  ctx.fillStyle=
    'rgba(214,220,230,.24)';

  ctx.fill();

  ctx.lineWidth=1.2;

  ctx.strokeStyle=
    'rgba(255,255,255,.52)';

  ctx.stroke();

  ctx.restore();

  ctx.save();

  rr(
    ctx,
    sc.x,
    sc.y,
    sc.w,
    sc.h,
    44
  );

  ctx.fillStyle='#77808d';

  ctx.fill();

  ctx.restore();

  fitImage(
    ctx,
    s.images.main,
    sc,
    'cover',
    s.controls.mainZoom,
    s.controls.mainX,
    s.controls.mainY,
    44
  );

  const shade=
    ctx.createLinearGradient(
      0,
      sc.y,
      0,
      sc.y+sc.h
    );

  shade.addColorStop(
    0,
    'rgba(0,0,0,.05)'
  );

  shade.addColorStop(
    .45,
    'rgba(0,0,0,0)'
  );

  shade.addColorStop(
    1,
    'rgba(0,0,0,.15)'
  );

  ctx.save();

  rr(
    ctx,
    sc.x,
    sc.y,
    sc.w,
    sc.h,
    44
  );

  ctx.clip();

  ctx.fillStyle=shade;

  ctx.fillRect(
    sc.x,
    sc.y,
    sc.w,
    sc.h
  );

  ctx.restore();

  const island={
    x:p.x+p.w/2-41.5,
    y:p.y+15,
    w:83,
    h:23
  };

  ctx.save();

  rr(
    ctx,
    island.x,
    island.y,
    island.w,
    island.h,
    12
  );

  ctx.fillStyle='#050608';

  ctx.fill();

  ctx.restore();
}

function drawSearch(ctx,s,t,final=false){
  const base=s.rects.search;
  const st=searchState(s,t,final);

  const r={
    x:base.x,
    y:base.y,
    w:st.width,
    h:base.h
  };

  glass(
    ctx,
    r,
    s.glassAlpha,
    29
  );

  if(st.text){
    drawText(
      ctx,
      st.text,
      r.x+18,
      r.y+r.h/2,
      14,
      500,
      'rgba(255,255,255,.92)',
      'left',
      'middle'
    );
  }

  const cx=r.x+r.w-28;
  const cy=r.y+r.h/2;

  ctx.save();

  ctx.strokeStyle=
    'rgba(255,255,255,.92)';

  ctx.lineWidth=2;

  ctx.beginPath();

  ctx.arc(
    cx-2,
    cy-1,
    8,
    0,
    Math.PI*2
  );

  ctx.stroke();

  ctx.beginPath();

  ctx.moveTo(
    cx+4,
    cy+5
  );

  ctx.lineTo(
    cx+10,
    cy+11
  );

  ctx.stroke();

  ctx.restore();
}

/* =========================================
   D-DAY 그리기 + 숫자 넘김 효과
   ========================================= */

function drawDday(ctx,s,t,final=false){
  const r=s.rects.dday;

  const labelRect=
    s.rects.ddayLabel;

  const countRect=
    s.rects.ddayCount;

  const dateRect=
    s.rects.ddayDate;

  const ds=
    ddayState(
      s,
      t,
      final
    );

  glass(
    ctx,
    r,
    s.glassAlpha,
    27
  );

  const labelY=
    labelRect&&labelRect.h
      ? labelRect.y+labelRect.h/2
      : r.y+21;

  drawText(
    ctx,
    s.text.ddayLabel,
    labelRect&&labelRect.w
      ? labelRect.x
      : r.x+17,
    labelY,
    10,
    700,
    'rgba(255,255,255,.72)',
    'left',
    'middle'
  );

  const countX=
    countRect&&countRect.w
      ? countRect.x
      : r.x+17;

  const countY=
    countRect&&countRect.h
      ? countRect.y+countRect.h/2
      : r.y+53;

  ctx.save();

  /*
    숫자를 넘길 때
    세로로 눌렸다가 원래 크기로 돌아오는 효과
  */
  if(ds.flipping){

    const p=
      clamp(ds.phase);

    const sy=
      p<.55
        ? .35
          +.63
          *easeOutCubic(
            p/.55
          )
        : .98
          +.02
          *easeOutCubic(
            (p-.55)/.45
          );

    ctx.globalAlpha=
      .45
      +.55
      *easeOutCubic(
        Math.min(
          1,
          p/.55
        )
      );

    ctx.translate(
      countX,
      countY
    );

    ctx.scale(
      1,
      sy
    );

    ctx.translate(
      -countX,
      -countY
    );
  }

  drawText(
    ctx,
    ds.text,
    countX,
    countY,
    31,
    650,
    '#fff',
    'left',
    'middle'
  );

  ctx.restore();

  /*
    flip 중간의 얇은 가로선
  */
  if(ds.flipping){

    ctx.save();

    ctx.globalAlpha=
      .22
      *(
        1
        -Math.abs(
          .5-ds.phase
        )*2
      );

    ctx.fillStyle='#fff';

    ctx.fillRect(
      countX,
      countY,
      Math.min(
        86,
        r.w-34
      ),
      1
    );

    ctx.restore();
  }

  /*
    사용자가 선택한 날짜는
    숫자 계산에는 쓰지 않고
    아래 작은 날짜 표시에만 사용
  */
  if(
    s.text.ddayDate &&
    dateRect &&
    dateRect.h
  ){

    drawText(
      ctx,
      s.text.ddayDate,
      dateRect.x,
      dateRect.y+dateRect.h/2,
      9,
      520,
      'rgba(255,255,255,.58)',
      'left',
      'middle'
    );
  }
}

function parseClock(v){
  const m=
    String(v||'')
      .trim()
      .match(
        /^(\d{1,3}):([0-5]\d)$/
      );

  return m
    ? (+m[1])*60+(+m[2])
    : 216;
}

function formatClock(sec){
  sec=Math.max(
    0,
    Math.round(sec)
  );

  const m=
    Math.floor(sec/60);

  const s=
    sec%60;

  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function musicPlaybackState(s,t){
  const total=
    parseClock(
      s.text.duration
    );

  const start=
    total
    *(s.controls.progress||0)
    /100;

  const elapsed=
    Math.max(
      0,
      t-s.timeline.musicStart
    );

  const current=
    Math.min(
      total,
      start+elapsed
    );

  const pct=
    total>0
      ? Math.min(
          100,
          current/total*100
        )
      : (s.controls.progress||0);

  return {
    total,
    current,
    pct
  };
}

function drawEqualizer(ctx,x,y,t){
  const widths=2.2;
  const gap=2.4;

  for(let i=0;i<4;i++){

    const wave=
      .5
      +.5
      *Math.sin(
        t*(5.6+i*.7)
        +i*1.7
      );

    const h=
      4+wave*9;

    ctx.fillStyle=
      'rgba(255,255,255,.82)';

    rr(
      ctx,
      x+i*(widths+gap),
      y-h/2,
      widths,
      h,
      1.1
    );

    ctx.fill();
  }
}

function drawMusic(ctx,s,t=0){
  const r=s.rects.music;

  glass(
    ctx,
    r,
    s.glassAlpha,
    28
  );

  const c=s.rects.cover;

  fitImage(
    ctx,
    s.images.cover,
    c,
    'cover',
    s.controls.coverZoom,
    s.controls.coverX,
    s.controls.coverY,
    20
  );

  const tx=
    c.x+c.w+14;

  drawText(
    ctx,
    s.text.song,
    tx,
    r.y+29,
    13,
    700,
    '#fff'
  );

  drawText(
    ctx,
    s.text.artist,
    tx,
    r.y+47,
    10,
    500,
    'rgba(255,255,255,.68)'
  );

  const playR=14;
  const playCx=r.x+r.w-28;
  const playCy=r.y+69;

  const eqX=
    playCx-34;

  const barX=
    tx;

  const barY=
    r.y+69;

  const barW=
    Math.max(
      28,
      eqX-10-barX
    );

  const pb=
    musicPlaybackState(
      s,
      t
    );

  ctx.fillStyle=
    'rgba(255,255,255,.28)';

  rr(
    ctx,
    barX,
    barY-1.5,
    barW,
    3,
    2
  );

  ctx.fill();

  ctx.fillStyle='#fff';

  rr(
    ctx,
    barX,
    barY-1.5,
    barW*pb.pct/100,
    3,
    2
  );

  ctx.fill();

  drawEqualizer(
    ctx,
    eqX,
    barY,
    t
  );

  ctx.beginPath();

  ctx.arc(
    playCx,
    playCy,
    playR,
    0,
    Math.PI*2
  );

  ctx.fillStyle=
    'rgba(255,255,255,.90)';

  ctx.fill();

  ctx.fillStyle='#17181c';

  ctx.fillRect(
    playCx-5,
    playCy-5,
    3,
    10
  );

  ctx.fillRect(
    playCx+2,
    playCy-5,
    3,
    10
  );

  drawText(
    ctx,
    formatClock(pb.current),
    barX,
    r.y+90,
    8,
    500,
    'rgba(255,255,255,.62)'
  );

  drawText(
    ctx,
    formatClock(pb.total),
    r.x+r.w-15,
    r.y+90,
    8,
    500,
    'rgba(255,255,255,.62)',
    'right'
  );

  let yy=r.y+114;

  for(
    let i=0;
    i<s.queue.length;
    i++
  ){
    const q=s.queue[i];

    ctx.fillStyle=
      'rgba(255,255,255,.16)';

    ctx.fillRect(
      r.x+14,
      yy-7,
      r.w-28,
      1
    );

    drawText(
      ctx,
      q.title,
      r.x+14,
      yy+10,
      11,
      620,
      '#fff'
    );

    drawText(
      ctx,
      q.artist,
      r.x+14,
      yy+25,
      9,
      500,
      'rgba(255,255,255,.62)'
    );

    drawText(
      ctx,
      String(i+2).padStart(2,'0'),
      r.x+r.w-14,
      yy+10,
      9,
      500,
      'rgba(255,255,255,.45)',
      'right'
    );

    yy+=40;
  }
}

function drawPost(ctx,s,t,final=false){
  if(!s.postVisible){
    return;
  }

  const imgR=
    s.rects.postImage;

  const titleR=
    s.rects.postTitle;

  fitImage(
    ctx,
    s.images.post,
    imgR,
    'contain',
    s.controls.postZoom,
    s.controls.postX,
    s.controls.postY,
    22
  );

  glass(
    ctx,
    titleR,
    Math.min(
      .26,
      s.glassAlpha+.02
    ),
    16
  );

  const title=
    postState(
      s,
      t,
      final
    );

  if(title){
    drawText(
      ctx,
      title,
      titleR.x+12,
      titleR.y+titleR.h/2,
      12,
      620,
      '#fff',
      'left',
      'middle'
    );
  }
}

function drawCommission(ctx,s){
  const text=
    (s.text.commission||'')
      .trim();

  if(!text){
    return;
  }

  ctx.save();

  ctx.font=
    '600 10px Inter, Pretendard, Arial, sans-serif';

  ctx.textAlign='left';
  ctx.textBaseline='bottom';

  ctx.fillStyle=
    'rgba(255,255,255,.96)';

  ctx.shadowColor=
    'rgba(0,0,0,.72)';

  ctx.shadowBlur=5;
  ctx.shadowOffsetX=0;
  ctx.shadowOffsetY=1.5;

  ctx.fillText(
    text,
    14,
    s.h-14
  );

  ctx.restore();
}

function loadImage(src){
  return new Promise(resolve=>{
    if(!src){
      resolve(null);
      return;
    }

    const img=
      new Image();

    img.onload=
      ()=>resolve(img);

    img.onerror=
      ()=>resolve(null);

    img.src=src;
  });
}
    
async function captureState(opts={}){
  const root=
    $('#capture');

  const rootRect=
    root.getBoundingClientRect();

  const glassValue=
    num(
      'glassOpacity',
      34
    );

  const queue=[];

  for(
    let i=1;
    i<=3;
    i++
  ){
    const title=
      val(`queueTitle${i}`);

    const artist=
      val(`queueArtist${i}`);

    if(
      title ||
      artist
    ){
      queue.push({
        title:title||'Untitled',
        artist:artist||'Unknown'
      });
    }
  }

  const [
    bg,
    main,
    cover,
    post
  ]=
    await Promise.all([
      loadImage(
        window.__pairBgSrc||''
      ),

      loadImage(
        $('#mainImage')?.src||''
      ),

      loadImage(
        $('#coverImage')?.src||''
      ),

      loadImage(
        $('#postImage')?.src||''
      )
    ]);

  const dur=
    num(
      'duration',
      5
    );

  const f=
    dur/5;

  const ddayEl=
    $('#ddayWidget');

  /*
    D+990에서 시작해서
    D+999+까지 넘어가는 데 필요한 시간 계산
  */
  const ddayStart=
          2.12*f,

        ddayDelay=
          .38*f,

        stepDur=
          num(
            'ddayFlipSpeed',
            .13
          ),

        /*
          990 → 991
              → 992
              → ...
              → 999
              → 999+

          총 10번 숫자가 바뀜
        */
        ddaySteps=
          10,

        ddaySequenceEnd=
          ddayStart
          +ddayDelay
          +(ddaySteps+1)
          *stepDur,

        postStart=
          Math.max(
            3.05*f,
            ddaySequenceEnd+.14
          );

  return {
    w:540,

    h:
      opts.height
      ||Math.round(
        rootRect.height
      ),

    duration:dur,

    effect:
      val('animEffect')
      ||'pop',

    glassAlpha:
      clamp(
        .10
        +glassValue/100*.34,
        .12,
        .34
      ),

    timeline:{
      searchStart:.42*f,
      musicStart:1.22*f,
      ddayStart,
      postStart
    },

    rects:{
      phone:
        localRect(
          $('#phone'),
          rootRect
        ),

      screen:
        localRect(
          $('.screen'),
          rootRect
        ),

      search:
        localRect(
          $('#searchWidget'),
          rootRect
        ),

      dday:
        localRect(
          ddayEl,
          rootRect
        ),

      ddayLabel:
        localRect(
          $('#ddayLabelOut'),
          rootRect
        ),

      ddayCount:
        localRect(
          $('#ddayCount'),
          rootRect
        ),

      ddayDate:
        localRect(
          $('#ddayDateOut'),
          rootRect
        ),

      music:
        localRect(
          $('#musicWidget'),
          rootRect
        ),

      cover:
        localRect(
          $('.cover'),
          rootRect
        ),

      post:
        localRect(
          $('#postWidget'),
          rootRect
        ),

      postImage:
        localRect(
          $('.post-image'),
          rootRect
        ),

      postTitle:
        localRect(
          $('.post-title'),
          rootRect
        )
    },

    images:{
      bg,
      main,
      cover,
      post
    },

    queue,

    postVisible:
      visible(
        $('#postWidget')
      ),

    controls:{
      bgZoom:
        num('bgZoom',1),

      bgBlur:
        num('bgBlur',0),

      bgX:
        num('bgX'),

      bgY:
        num('bgY'),

      mainZoom:
        num('zoom',1),

      mainX:
        num('posX'),

      mainY:
        num('posY'),

      coverZoom:
        num('coverZoom',1),

      coverX:
        num('coverX'),

      coverY:
        num('coverY'),

      postZoom:
        num('postZoom',1),

      postX:
        num('postX'),

      postY:
        num('postY'),

      progress:
        num('progress',42),

      typingSpeed:
        num('typingSpeed',18),

      postTypingSpeed:
        num(
          'postTypingSpeed',
          16
        ),

      /*
        HTML의 숫자 넘김 속도 슬라이더는
        그대로 사용
      */
      ddayFlipSpeed:
        num(
          'ddayFlipSpeed',
          .13
        )
    },

    text:{
      search:
        val('searchTextInput')
        ||txt('#searchTextOut'),

      ddayLabel:
        txt('#ddayLabelOut'),

      /*
        최종값은 무조건 D+999+
      */
      ddayCount:
        'D+999+',

      ddayDate:
        visible(
          $('#ddayDateOut')
        )
          ? txt('#ddayDateOut')
          : '',

      song:
        txt('#songOut'),

      artist:
        txt('#artistOut'),

      current:
        txt('#currentTimeOut'),

      duration:
        txt('#durationTimeOut'),

      postTitle:
        val('postCaption')
        ||txt('#postCaptionOut'),

      commission:
        (
          (
            $('#commissionText')?.value
            ||$('#commissionCredit')?.textContent
            ||''
          ).trim()
        )
    },

    dday:{
      animate:true,
      value:999,
      prefix:'D+',

      bottomPadding:
        parseFloat(
          getComputedStyle(
            ddayEl
          ).paddingBottom
        )
        ||15
    }
  };
}
    
function motionProgress(s,t,name){
  const f=s.duration/5;

  const starts={
    search:
      .42*f,

    music:
      1.22*f,

    dday:
      2.12*f,

    post:
      s.timeline.postStart
  };

  const lens={
    search:
      .62*f,

    music:
      .72*f,

    dday:
      .66*f,

    post:
      .74*f
  };

  return clamp(
    (
      t-starts[name]
    )
    /Math.max(
      .001,
      lens[name]
    )
  );
}

function motionTransform(effect,p){
  const q=
    easeOutCubic(p);

  if(effect==='snap'){
    return {
      alpha:1,
      scale:1,
      dy:0
    };
  }

  if(effect==='fade'){
    return {
      alpha:q,
      scale:.985+.015*q,
      dy:0
    };
  }

  if(effect==='slide'){
    return {
      alpha:q,
      scale:1,
      dy:30*(1-q)
    };
  }

  const overshoot=
    .15
    *Math.sin(
      Math.PI*clamp(p)
    )
    *Math.exp(
      -1.35*p
    );

  return {
    alpha:
      clamp(
        p*1.8
      ),

    scale:
      .70
      +.30*q
      +overshoot,

    dy:
      14*(1-q)
  };
}

function drawMotion(
  ctx,
  s,
  t,
  name,
  fn,
  final=false
){
  if(final){
    fn(
      ctx,
      s,
      t,
      true
    );

    return;
  }

  const p=
    motionProgress(
      s,
      t,
      name
    );

  if(p<=0){
    return;
  }

  const m=
    motionTransform(
      s.effect||'pop',
      p
    );

  const r=
    s.rects[name];

  const motionScale=
    name==='music'
      ? 1
      : m.scale;

  ctx.save();

  ctx.globalAlpha*=
    m.alpha;

  const cx=
    r.x+r.w/2;

  const cy=
    r.y+r.h/2;

  ctx.translate(
    cx,
    cy+m.dy
  );

  ctx.scale(
    motionScale,
    motionScale
  );

  ctx.translate(
    -cx,
    -cy
  );

  fn(
    ctx,
    s,
    t,
    false
  );

  ctx.restore();
}

const renderCache=
  new WeakMap();

function getRenderBuffers(
  state,
  scale
){
  let scales=
    renderCache.get(state);

  if(!scales){
    scales=new Map();

    renderCache.set(
      state,
      scales
    );
  }

  const key=
    String(scale);

  let cached=
    scales.get(key);

  if(!cached){

    const width=
      Math.round(
        state.w*scale
      );

    const height=
      Math.round(
        state.h*scale
      );

    const base=
      document.createElement(
        'canvas'
      );

    base.width=
      width;

    base.height=
      height;

    const baseCtx=
      base.getContext('2d');

    baseCtx.imageSmoothingEnabled=
      true;

    baseCtx.imageSmoothingQuality=
      'high';

    baseCtx.setTransform(
      scale,
      0,
      0,
      scale,
      0,
      0
    );

    drawBackground(
      baseCtx,
      state
    );

    drawPhone(
      baseCtx,
      state
    );

    const canvas=
      document.createElement(
        'canvas'
      );

    canvas.width=
      width;

    canvas.height=
      height;

    const ctx=
      canvas.getContext('2d');

    ctx.imageSmoothingEnabled=
      true;

    ctx.imageSmoothingQuality=
      'high';

    cached={
      canvas,
      ctx,
      base,
      width,
      height
    };

    scales.set(
      key,
      cached
    );
  }

  return cached;
}

function render(
  state,
  t,
  {
    final=false,
    scale=1
  }={}
){
  scale=
    Math.max(
      1,
      Number(scale)||1
    );

  const {
    canvas,
    ctx,
    base,
    width,
    height
  }=
    getRenderBuffers(
      state,
      scale
    );

  ctx.setTransform(
    1,
    0,
    0,
    1,
    0,
    0
  );

  ctx.globalAlpha=1;

  ctx.clearRect(
    0,
    0,
    width,
    height
  );

  ctx.drawImage(
    base,
    0,
    0
  );

  ctx.setTransform(
    scale,
    0,
    0,
    scale,
    0,
    0
  );

  drawMotion(
    ctx,
    state,
    t,
    'search',
    drawSearch,
    final
  );

  drawMotion(
    ctx,
    state,
    t,
    'music',
    drawMusic,
    final
  );

  drawMotion(
    ctx,
    state,
    t,
    'dday',
    drawDday,
    final
  );

  if(state.postVisible){
    drawMotion(
      ctx,
      state,
      t,
      'post',
      drawPost,
      final
    );
  }

  drawCommission(
    ctx,
    state
  );

  return canvas;
}

window.PairExportRenderer={
  version:'20261007-34',
  captureState,
  render
};

})();

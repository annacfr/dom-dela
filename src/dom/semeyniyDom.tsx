import { useState } from 'react';
export function SemeyniyDom({ mood, progress }: { mood: string; progress: number }) {
  const [tilt, setTilt] = useState(0);
  return <div className={`house-scene mood-${mood.toLowerCase()}`} onPointerMove={e => { if (e.buttons) setTilt(Math.max(-9, Math.min(9, (e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.clientWidth * 18 - 9))); }} onPointerUp={() => setTilt(0)} onPointerLeave={() => setTilt(0)} role="img" aria-label={`Семейный дом и сад. Состояние: ${mood}. Выполнено дел: ${progress}`}>
    <div className="sky-orb" /><svg className="house-svg" viewBox="0 0 600 350" style={{ transform: `rotateY(${tilt}deg)` }} aria-hidden="true">
      <ellipse cx="300" cy="292" rx="244" ry="44" fill="#aec298" /><path d="M80 291q220-26 438 0" stroke="#82976b" strokeWidth="10" fill="none" />
      <path d="M96 281v-74l21-31 21 31v74z M101 207h32" fill="#587762" stroke="#496b56" strokeWidth="4" /><path d="M455 281v-91l20-32 21 32v91z M460 190h31" fill="#5f8062" stroke="#4e6a50" strokeWidth="4" />
      <path d="M126 278v-55l15-24 15 24v55z M505 278v-56l15-24 15 24v56z" fill="#78956e" />
      <path d="M170 260V122l112-60 110 60v138z" fill="#f2dfbd" stroke="#bba586" strokeWidth="3" /><path d="M170 122 282 62l110 60-24 13-86-44-87 44z" fill="#4f6060" /><path d="M282 62 392 122l28 35-28-12-110-54z" fill="#354d4d" />
      <path d="M369 164h91v98h-91z" fill="#dbc69f" /><path d="M353 159h125l-28-30h-76z" fill="#725c4e" /><path d="M353 159h125v9H353z" fill="#5d4c45" />
      <path d="M226 180h52v80h-52z" fill="#456b66" stroke="#344c49" strokeWidth="4" /><circle cx="266" cy="222" r="3" fill="#eec57f" /><path d="M303 153h39v48h-39z M309 159h27v36h-27z" fill="#83a8a0" stroke="#fff1d4" strokeWidth="5" /><path d="M322 159v36 M309 177h27" stroke="#fff1d4" strokeWidth="3" />
      <path d="M384 177v84 M444 177v84 M367 261h97" stroke="#9d7456" strokeWidth="6" /><path d="M386 208h58v4h-58z" fill="#9d7456" /><path d="M399 240h30l8 19h-45z" fill="#b0835c" />
      <path d="M225 263h78l28 26h-125z" fill="#d6c6a8" /><ellipse cx="280" cy="295" rx="31" ry="8" fill="#e9ddc8" /><ellipse cx="313" cy="305" rx="24" ry="7" fill="#e9ddc8" />
      <ellipse cx="179" cy="275" rx="26" ry="14" fill="#607e59" /><ellipse cx="421" cy="275" rx="24" ry="13" fill="#6f8c5d" /><ellipse cx="490" cy="287" rx="25" ry="10" fill="#63815c" />
      {progress > 0 && <g fill="#e9b789"><circle cx="159" cy="287" r="4" /><circle cx="191" cy="285" r="4" /><circle cx="415" cy="289" r="4" /><circle cx="468" cy="294" r="4" /></g>}
      {progress > 3 && <g fill="#f3dec5"><circle cx="129" cy="292" r="4" /><circle cx="453" cy="299" r="4" /><circle cx="503" cy="299" r="4" /></g>}
    </svg><div className="house-caption"><span className="house-caption-title">Наш семейный дом</span><span>{progress ? `Сад расцветает: ${progress} дел выполнено` : 'Каждое дело помогает саду расти'}</span></div>
  </div>;
}

/** Original vector artwork shared by the website and the native web view. */
export function BrandMark({ className = "" }: { className?: string }) {
  return <svg className={className} width="44" height="44" viewBox="0 0 64 64" fill="none" aria-hidden="true"><rect width="64" height="64" rx="21" fill="#234C3B"/><path d="M17 35C17 18 33 13 48 16c1 17-8 30-23 27l15-18-23 10Z" fill="#D4F58A"/><path d="M18 48c4-12 12-19 22-23" stroke="#D4F58A" strokeWidth="4" strokeLinecap="round"/></svg>;
}

export function BrandArt() {
  return <svg className="botanical-art" viewBox="0 0 540 590" fill="none" aria-hidden="true">
    <path d="M38 130C38 61 94 5 163 5H378C447 5 503 61 503 130V556H38V130Z" fill="#234C3B"/>
    <g stroke="#B2C49C" opacity=".24" strokeWidth="1">
      <path d="M51 370C123 255 56 155 196 94S410 97 492 45M48 397C149 258 76 182 216 121S413 119 495 74M42 427C175 260 96 209 236 148S416 141 499 103M38 457C201 262 116 236 256 175S419 163 503 132M38 487C227 264 136 263 276 202S422 185 503 161M38 517C253 266 156 290 296 229S425 207 503 190"/>
    </g>
    <g className="scene-layer scene-sun"><circle cx="393" cy="112" r="53" fill="#DE9A76"/>
    <path d="M321 75A53 53 0 0 1 426 112" stroke="#F5F1E7"/>
    </g>
    <g className="scene-layer scene-city"><g fill="#53705B"><path d="M71 421V309H116V421H71ZM128 421V274H180V421H128ZM191 421V323H221V421H191ZM358 421V291H398V421H358ZM410 421V340H454V421H410Z"/></g>
    <path d="M84 325V343M101 325V343M84 357V375M101 357V375M141 291V309M163 291V309M141 323V341M163 323V341M371 310V328M386 310V328M371 342V360M386 342V360" stroke="#C5D1B5" opacity=".5"/>
    </g>
    <path d="M38 450C124 418 175 456 243 425S418 400 503 438V556H38V450Z" fill="#92A677"/>
    <path d="M38 505C150 421 234 534 338 474S459 477 503 490V556H38V505Z" fill="#CBD7A6"/>
    <path d="M190 556C147 517 316 496 288 459C280 448 246 444 246 423" stroke="#F5F1E7" strokeWidth="18"/>
    <path className="scene-trail" d="M190 556C147 517 316 496 288 459C280 448 246 444 246 423" stroke="#234C3B" strokeWidth="1.5" strokeDasharray="3 8"/>
    <g className="scene-layer scene-plant"><g className="scene-leaves">
    <path d="M249 427C267 336 252 274 333 145" stroke="#D4F58A" strokeWidth="5" strokeLinecap="round"/>
    <path d="M271 302C244 209 301 127 385 109C381 208 343 279 271 302Z" fill="#D4F58A"/>
    <path d="M271 302C294 234 332 167 385 109" stroke="#486D43" strokeWidth="2"/>
    <path d="M285 263L328 254M302 222L355 213M324 179L372 166M300 227L285 188M322 184L310 156" stroke="#486D43"/>
    <path d="M260 354C170 361 131 304 125 237C205 238 254 275 260 354Z" fill="#A8C480"/>
    <path d="M260 354C221 309 175 273 125 237" stroke="#486D43" strokeWidth="2"/>
    <path d="M227 321L188 326M202 297L161 297M226 321L226 286M199 295L196 265" stroke="#486D43"/>
    </g></g>
    <g className="scene-layer scene-card"><g transform="translate(21 184) rotate(-9)"><rect width="100" height="106" rx="3" fill="#F5F1E7"/><path d="M16 20H84M16 86H84" stroke="#234C3B"/><path d="M48 71C48 55 61 45 72 37M45 62C29 62 25 49 24 39C38 39 47 46 45 62ZM51 55C48 39 58 29 74 29C72 45 65 53 51 55Z" stroke="#234C3B" strokeWidth="1.7"/><circle cx="85" cy="12" r="3" fill="#DE9A76"/></g></g>
    <g className="scene-layer scene-compass"><g transform="translate(436 402)"><circle r="48" fill="#DE9A76"/><g className="scene-compass-dial"><circle r="38" stroke="#234C3B" strokeDasharray="2 5"/><path d="M-19 0H19M0-19V19M-13-13L13 13M-13 13L13-13" stroke="#234C3B" strokeWidth="2"/></g><circle r="7" fill="#234C3B"/></g></g>
    <path d="M11 567H529M21 560V574M519 560V574" stroke="#234C3B"/>
    <g fill="#234C3B"><circle cx="250" cy="582" r="2"/><circle cx="264" cy="582" r="2"/><circle cx="278" cy="582" r="2"/></g>
  </svg>;
}

export function StepArt({ step }: { step: 1 | 2 | 3 }) {
  return <svg className="step-art" viewBox="0 0 300 160" fill="none" aria-hidden="true">
    {step === 1 && <><circle cx="217" cy="42" r="27" fill="#DE9A76"/><path d="M32 137C79 84 130 134 177 108S247 117 275 127" stroke="#849872" strokeWidth="1.5"/><path d="M173 112C170 73 194 43 224 43C223 79 203 107 173 112Z" fill="#A8BC8E"/><path d="M173 112L211 56" stroke="#234C3B"/><rect x="62" y="48" width="121" height="81" rx="7" fill="#F8F4E9" stroke="#234C3B" strokeWidth="2"/><path d="M90 48L99 34H143L151 48" stroke="#234C3B" strokeWidth="2"/><circle cx="123" cy="88" r="25" stroke="#234C3B" strokeWidth="2"/><circle cx="123" cy="88" r="15" stroke="#234C3B"/><path d="M77 62H88M111 88H135M123 76V100" stroke="#234C3B" strokeWidth="1.5"/></>}
    {step === 2 && <><path d="M45 42L112 24L185 42L251 25V128L185 145L112 128L45 145V42Z" fill="#F8F4E9" stroke="#234C3B" strokeWidth="1.5"/><path d="M112 24V128M185 42V145M49 111C89 66 129 123 160 82S210 69 249 50" stroke="#809670" strokeWidth="1.3"/><path d="M70 123C107 75 127 105 151 77S201 92 225 60" stroke="#234C3B" strokeDasharray="4 5"/><path d="M197 45C197 67 167 89 167 89S137 67 137 45A30 30 0 1 1 197 45Z" fill="#DE9A76" stroke="#234C3B" strokeWidth="1.5"/><circle cx="167" cy="45" r="10" stroke="#234C3B" strokeWidth="1.5"/></>}
    {step === 3 && <><circle cx="147" cy="79" r="64" fill="#D4DFB3"/><path d="M66 123C101 99 120 120 148 105C165 96 184 97 204 107L224 122" stroke="#234C3B" strokeWidth="2" strokeLinecap="round"/><path d="M150 104C149 74 157 52 176 34M152 77C130 78 114 61 116 43C137 45 151 56 152 77ZM157 65C156 43 169 30 192 29C190 49 177 64 157 65Z" stroke="#234C3B" strokeWidth="2"/><path d="M75 47H91M83 39V55M216 75H234M225 66V84" stroke="#A66A4D" strokeWidth="1.5"/></>}
  </svg>;
}

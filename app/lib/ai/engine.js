// On-device text understanding and the Lab 01 match rule, ported as-is from the single-file prototype (../../../index.html).
// Kept in plain JS so the logic stays line-for-line comparable with the prototype; typed wrappers live in ./story.ts.
const TIME_CHIPS = ['Just now', '1–2 hours ago', 'Today', 'Yesterday'];
// each quick choice becomes a concrete date + time (or time window)
const fmtDay = d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtHM = d => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
function timeFromChip(chip) {
  const now = new Date(), h = ms => new Date(now - ms * 3600e3);
  if (chip === 'Just now') return `${fmtDay(now)}, ${fmtHM(now)}`;
  if (chip === '1–2 hours ago') return `${fmtDay(h(2))}, ${fmtHM(h(2))}–${fmtHM(h(1))}`;
  if (chip === 'This morning') return `${fmtDay(now)}, 06:00–12:00`;
  if (chip === 'Yesterday') { const y = new Date(now); y.setDate(y.getDate() - 1); return `${fmtDay(y)} · time not sure`; }
  return chip;
}
// words from a message → the matching quick choice ("час назад" → 1–2 hours ago)
function chipFromText(t) {
  if (/just now|только что|сейчас/i.test(t)) return 'Just now';
  if (/(an?|1|2|one|two|пару|час|1|2)\s*(hours?|час\w*)\s*(ago|назад)|hour ago|час назад/i.test(t)) return '1–2 hours ago';
  if (/this morning|утром|с утра/i.test(t)) return 'This morning';
  if (/^(yesterday|вчера)$/i.test(t.trim())) return 'Yesterday';
  return null;
}
// an older date is remembered only roughly: a day + part of the day, never minutes
const DAY_PARTS = [['Morning', '06:00–12:00', 6], ['Afternoon', '12:00–18:00', 12], ['Evening', '18:00–23:00', 18], ['Night', '23:00–06:00', 0]];
const isoDay = d => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 10); };
function dayLabel(f) {
  const p = DAY_PARTS.find(x => x[0] === f.part);
  const day = f.date === isoDay(new Date()) ? 'Today' : fmtDay(new Date(f.date + 'T12:00'));
  if (f.exact) return `${day} · ${f.exact}`;
  return `${day} · ${p ? `${p[0].toLowerCase()} (${p[1]})` : 'time of day not sure'}`;
}
const partOfHour = h => h >= 6 && h < 12 ? 'Morning' : h >= 12 && h < 18 ? 'Afternoon' : h >= 18 && h < 23 ? 'Evening' : 'Night';
// "yesterday evening", "вчера вечером", "on Monday at 5 pm", "20 ноября утром" → a day + part of the day (or an exact time)
function parseWhen(text) {
  const s = ' ' + text.toLowerCase().replace(/ё/g, 'е') + ' ', now = new Date();
  const day = n => { const d = new Date(now); d.setDate(d.getDate() - n); return isoDay(d); };
  if (/just now|right now|только что|прямо сейчас/.test(s)) return { chip: 'Just now' };
  if (/(\b(an?|one|two|1|2|a couple of)\s+hours?\s+ago|\bhour ago|(\d+|a few|few)\s+minutes?\s+ago|(час|пару часов|два часа|1 час|2 часа|полчаса|\d+\s+минут\w*)\s+назад)/.test(s)) return { chip: '1–2 hours ago' };
  const NUM = { two: 2, three: 3, four: 4, five: 5, six: 6, два: 2, две: 2, три: 3, четыре: 4, пять: 5, шесть: 6 };
  let date = null, m;
  if (/day before yesterday|позавчера/.test(s)) date = day(2);
  else if (/yesterday|вчера|last night/.test(s)) date = day(1);
  else if ((m = s.match(/(\d+|two|three|four|five|six|два|две|три|четыре|пять|шесть)\s+(days?|дн\w*|дня)\s+(ago|назад)/))) date = day(+m[1] || NUM[m[1]] || 2);
  if (!date) {
    const WD = [['sunday', 'воскресень'], ['monday', 'понедельник'], ['tuesday', 'вторник'], ['wednesday', 'сред'], ['thursday', 'четверг'], ['friday', 'пятниц'], ['saturday', 'суббот']];
    const i = WD.findIndex(([en, ru]) => s.includes(en) || s.includes(ru));
    if (i >= 0) date = day((now.getDay() - i + 7) % 7 || 7);
  }
  if (!date) {
    const MON = [['jan', 'январ'], ['feb', 'феврал'], ['mar', 'март'], ['apr', 'апрел'], ['may', 'ма[яй]'], ['jun', 'июн'], ['jul', 'июл'], ['aug', 'август'], ['sep', 'сентябр'], ['oct', 'октябр'], ['nov', 'ноябр'], ['dec', 'декабр']];
    for (let k = 0; k < 12 && !date; k++) {
      const re = new RegExp(`(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:${MON[k][0]}\\w*|${MON[k][1]}\\w*)|(?:${MON[k][0]}\\w*)\\s+(\\d{1,2})`);
      const mm = s.match(re);
      if (mm) { const d = new Date(now.getFullYear(), k, +(mm[1] || mm[2]), 12); if (d > now) d.setFullYear(d.getFullYear() - 1); date = isoDay(d); }
    }
  }
  // part of the day
  let part = null;
  if (/morning|утр|с утра/.test(s)) part = 'Morning';
  else if (/afternoon|lunch|noon|\bдн[её]м\b|в обед|после обеда/.test(s)) part = 'Afternoon';
  else if (/evening|tonight|вечер/.test(s)) part = 'Evening';
  else if (/night|ноч/.test(s)) part = 'Night';
  // exact time: "at 17:30", "в 5 вечера", "at 5 pm"
  let exact = null;
  if ((m = s.match(/(\d{1,2})[:.](\d{2})/))) exact = [+m[1], +m[2]];
  else if ((m = s.match(/(\d{1,2})\s*(am|pm|a\.m\.|p\.m\.)/))) exact = [(+m[1] % 12) + (/p/.test(m[2]) ? 12 : 0), 0];
  else if ((m = s.match(/в\s+(\d{1,2})\s*(час\w*)?\s*(утра|дня|вечера|ночи)?/)) && (m[2] || m[3])) exact = [+m[1] + (/дня|вечера/.test(m[3] || '') && +m[1] < 12 ? 12 : 0), 0];
  else if ((m = s.match(/\b(?:at|around|about|approximately)\s+(\d{1,2})(?![\d:.])(?!\s*(?:hours?|minutes?|days?|km|m\b))/))) exact = [+m[1] + (+m[1] < 12 && /afternoon|evening|tonight|вечер|дн[её]м/.test(s) ? 12 : 0), 0];
  if (exact && exact[0] < 24) { part = partOfHour(exact[0]); exact = `${String(exact[0]).padStart(2, '0')}:${String(exact[1]).padStart(2, '0')}`; } else exact = null;
  const weak = !date && !exact && !/today|сегодня/.test(s); // only "morning"/"вечером" — could be part of a description
  if (!date && (part || exact || /today|сегодня/.test(s))) date = day(0);
  if (!date) return null;
  if (/last night/.test(s)) part = 'Night';
  return { date, part, exact, weak };
}

const PLACES = ['Central Park', 'Central Park · north entrance', 'Central Park · dog area', 'Main Street', 'Market Square', 'Riverside Walk',
  'Train Station', 'Bus stop · Main Street', 'City Library', 'School playground', 'Shopping mall parking', 'Botanical Garden', 'Old Town',
  'Парк Горького', 'Парк Сокольники', 'Центральная улица', 'Рыночная площадь', 'Набережная', 'Вокзал', 'Школьный двор'];
const CITIES = ['Lisbon', 'Lisboa', 'Porto', 'Madrid', 'Barcelona', 'Paris', 'London', 'Berlin', 'Rome', 'Milan', 'Amsterdam', 'Vienna', 'Prague',
  'Warsaw', 'Belgrade', 'Istanbul', 'Tbilisi', 'Yerevan', 'Almaty', 'Dubai', 'New York', 'Los Angeles', 'Toronto', 'Kyiv', 'Minsk', 'Moscow',
  'Saint Petersburg', 'Лиссабон', 'Порту', 'Москва', 'Санкт-Петербург', 'Питер', 'Киев', 'Минск', 'Казань', 'Новосибирск', 'Екатеринбург',
  'Нижний Новгород', 'Самара', 'Краснодар', 'Сочи', 'Тбилиси', 'Ереван', 'Алматы', 'Белград', 'Стамбул', 'Берлин', 'Париж', 'Лондон'];
// matches a city in any case form: "в Москве", "из Питера", "in Lisbon"
function findCity(text) {
  for (const c of CITIES) {
    const stem = c.length > 5 ? c.slice(0, c.length - 2) : c.slice(0, Math.max(4, c.length - 1));
    if (new RegExp(`(^|[^\\p{L}])${stem.replace(/[-\s]/g, '[-\\s]')}\\p{L}{0,3}(?![\\p{L}])`, 'iu').test(text)) return c;
  }
  return null;
}

function colourName(r, g, b) {
  const mx = Math.max(r, g, b) / 255, mn = Math.min(r, g, b) / 255, l = (mx + mn) / 2, dlt = mx - mn;
  const s = dlt === 0 ? 0 : dlt / (1 - Math.abs(2 * l - 1));
  let h = 0;
  if (dlt) { const R = r / 255, G = g / 255, B = b / 255; h = mx === R ? 60 * (((G - B) / dlt) % 6) : mx === G ? 60 * ((B - R) / dlt + 2) : 60 * ((R - G) / dlt + 4); if (h < 0) h += 360; }
  if (l < .18) return 'black';
  if (l > .82 && s < .35) return 'white';
  if (s < .15) return l < .45 ? 'dark grey' : 'grey';
  if (h < 50) return l < .38 ? 'dark brown' : s > .45 && l > .45 ? 'ginger' : 'brown';
  if (h < 70) return l > .7 ? 'cream' : 'golden';
  return 'multicoloured';
}
// ---------- photo recognition: MobileNet (ImageNet) running in the browser, loaded on first use ----------
// ImageNet class index ranges → animal kinds; breed = most likely class inside the winning range
const KINDS = [
  ['Dog', [[151, 268]], true], ['Cat', [[281, 285]], true],
  ['Bird', [[7, 24], [80, 100], [127, 146]], true], ['Rabbit', [[330, 332]], true],
  ['Hamster', [[333, 333]]], ['Guinea pig', [[338, 338]]], ['Ferret', [[358, 359]]],
  ['Lizard', [[38, 48]], true], ['Turtle', [[33, 37]], true], ['Snake', [[52, 68]], true],
  ['Fish', [[0, 6], [389, 397]], true], ['Horse', [[339, 339]]],
];

const VOCAB = (
  // lost / found / sections
  'lost lose missing escaped disappeared found stray spotted adopt adoption shelter rescue ' +
  'vaccine vaccines vaccination vet veterinarian clinic sick vomiting grooming groomer walker walking sitter sitting ' +
  'training trainer insurance buy order shop food treats toys leash collar harness litter bowl carrier shampoo ' +
  // animals
  'dog dogs puppy cat cats kitten bird parrot budgie canary cockatiel rabbit bunny hamster ferret turtle tortoise snake horse ' +
  'lizard gecko iguana chameleon frog chinchilla hedgehog animal ' +
  'ящерица ящерицу игуана хамелеон лягушка лягушку крыса крысу мышка мышку шиншилла шиншиллу ёжик ежик животное ' +
  // time / place / glue
  'yesterday today tonight morning evening afternoon hour hours minutes ago near around park street garden ' +
  'away flew gone named called please help ' +
  // russian
  'потерял потеряла потерялся потерялась потеряли пропал пропала пропали убежал убежала сбежал сбежала улетел улетела исчез исчезла ' +
  'нашел нашёл нашла нашли подобрал подобрала бездомная бездомный ' +
  'собака собаку собаки собачка собачку пёс пса щенок щенка щенку кошка кошку кошки котик кот кота коту котёнок котенок котёнка котенка ' +
  'попугай попугая попугайчик птица птицу птичка кролик кролика хомяк хомяка черепаха черепаху ' +
  'вчера сегодня утром вечером ночью днём час часа часов назад минут около возле рядом парке парк улице улица дворе сквере ' +
  'прививки прививку прививка вакцина ветеринар ветеринара клиника заболел заболела болеет передержка передержку стрижка груминг выгул дрессировка ' +
  'купить корм корма поводок ошейник наполнитель игрушки миска переноска приют приюта взять хочу зовут кличка кличке ошейнике чип'
).split(/\s+/);
const VOCAB_SET = new Set(VOCAB);
// ordinary words that look like keywords — never "correct" these
const KEEP = new Set(('close those nose rose hose post most cost host list last lest fond fund find fine kind mind wind good hood wood mood ' +
  'foot feed need seed weed big bag bat hat car cut cot not dot hot dig dug fog log hog cap cab cut bed red ted ' +
  'near wear hear year dear bear fear gear dark bark mark work word help held here there where were when then them they this that what ' +
  'with have has had was will want went walk talk tall wall ball call fall hall sell tell well shop ship shot shoot short shut stop ' +
  'vet yet get set let met net wet bet pet pets fat hat sat mat rat fit hit sit bit kit wit dot ' +
  'today toady order older other otter mother father brother sister parent parents garden harden ' +
  'house mouse home come some more from your yours also just like know time take make made back does done very much many such only over ' +
  'into than been being about after again could would should their there these every never ever even ever also still both each other ' +
  'the and for you are but not all any can her him his how its our out who why yes off own may say see two too use way day boy ' +
  'hours hour cats dogs road roads lane yard shed hall mall gate store stores floor door ' +
  'это как так там тут чем кот ком дом дым сам нам вам сон сын сок рот кит лес лис час чай раз кто что где мой моя мое моё мне меня ' +
  'парка парку улицы улицу сквера двора дома домом рядом около был была было были есть нет она они его еще ещё уже очень')
  .split(/\s+/));
function osaDistance(a, b) { // optimal string alignment: insert / delete / replace / swap = 1
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    const c = a[i - 1] === b[j - 1] ? 0 : 1;
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
    if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
  }
  return d[a.length][b.length];
}
function bestWord(w) {
  const lw = w.toLowerCase().replace(/ё/g, 'е');
  if (VOCAB_SET.has(lw) || VOCAB_SET.has(w.toLowerCase()) || KEEP.has(lw) || lw.length < 3) return null;
  const max = lw.length <= 3 ? 1 : lw.length <= 7 ? 1 : 2;
  let best = null, bd = 99;
  for (const cand of VOCAB) {
    if (Math.abs(cand.length - lw.length) > max) continue;
    const dist = osaDistance(lw, cand.replace(/ё/g, 'е'));
    // 3-letter words are risky: accept only swapped letters ("dgo" → "dog"), one missing letter ("fod" → "food")
    // or one wrong vowel ("кат" → "кот")
    if (lw.length === 3) {
      const swap = [...lw].sort().join('') === [...cand].sort().join('');
      const missing = cand.length === 4;
      const V = /[aeiouyаеёиоуыэюя]/;
      const vowel = cand.length === 3 && [...lw].filter((ch, i) => ch !== cand[i]).length === 1 && [...lw].every((ch, i) => ch === cand[i] || (V.test(ch) && V.test(cand[i])));
      if (!(dist === 1 && (swap || missing || vowel))) continue;
    }
    if (dist < bd || (dist === bd && cand[0] === lw[0] && best && best[0] !== lw[0])) { bd = dist; best = cand; }
  }
  return bd <= max ? best : null;
}
// wrong keyboard layout: "yt hfcgjpyfk" → "не распознал", "дщые" → "lost"
const EN_KEYS = "qwertyuiop[]asdfghjkl;'zxcvbnm,.`QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>~";
const RU_KEYS = 'йцукенгшщзхъфывапролджэячсмитьбюёЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮЁ';
const EN2RU = Object.fromEntries([...EN_KEYS].map((c, i) => [c, RU_KEYS[i]]));
const RU2EN = Object.fromEntries([...RU_KEYS].map((c, i) => [c, EN_KEYS[i]]));
const COMMON = new Set(('i a me my is it in on at to of and or so we he she they you your his her its im ive dont cant ' +
  'не и в во на с со по к у о об за из от до для что это как я мы ты вы он она они мне меня есть нет да или но а могу можем найти найдите ищу помочь помоги где-то ' +
  'знаю было была могу нетак уже где когда ' +
  'мой моя мою свою своего наш нашу вот тип перед именем имя экран второй добавь помогите пожалуйста срочно вчера сегодня животное животного').split(/\s+/));
const knownWord = w => VOCAB_SET.has(w) || KEEP.has(w) || COMMON.has(w);
function fixLayout(text, fixes) {
  const parts = text.split(/(\s+)/);
  const plan = parts.map(t => {
    if (!t.trim()) return null;
    const latin = /[A-Za-z]/.test(t) && !/[А-Яа-яЁё]/.test(t), cyr = /[А-Яа-яЁё]/.test(t) && !/[A-Za-z]/.test(t);
    if (!latin && !cyr) return null;
    const core = t.toLowerCase().replace(latin ? /[^a-z']/g : /[^а-яё]/g, '');
    if (knownWord(core)) return { known: true, latin };
    const conv = [...t].map(c => (latin ? EN2RU : RU2EN)[c] ?? c).join('');
    const cc = conv.toLowerCase().replace(latin ? /[^а-яё]/g : /[^a-z']/g, '');
    const hit = knownWord(cc) || (cc.length >= 4 && bestWord(cc));
    return { conv, sure: !!hit, name: /^[A-ZА-ЯЁ][a-zа-яё]+$/.test(t), latin };
  });
  const conv = plan.filter(p => p && !p.known);
  const sure = conv.filter(p => p.sure).length, unsure = conv.filter(p => !p.sure).length;
  if (!sure) return text;
  const switchAll = sure >= unsure; // most unknown words make sense in the other layout → switch the rest too
  // a name is switched too only when the whole message was typed in the wrong layout
  // ("Z gjnthzkf cj,fre Htrc" → "…Рекс"), not in a mixed one ("lizard Hank yt hfcgjpyfk")
  const sureLatin = conv.some(p => p.sure && p.latin);
  const keptSameScript = plan.some(p => p && p.known && p.latin === sureLatin);
  return parts.map((t, i) => {
    const p = plan[i];
    if (!p || p.known || !(p.sure || (switchAll && (!p.name || !keptSameScript)))) return t;
    fixes.push([t, p.conv]); return p.conv;
  }).join('');
}

// returns corrected text; remembers what was changed so the AI can say how it read the message
function autocorrect(text) {
  const fixes = [];
  text = fixLayout(text, fixes);
  const out = text.replace(/[A-Za-zА-Яа-яЁё']+/g, w => {
    // an inflected form of a known word ("ошейником", "parks") is not a typo
    const lw = w.toLowerCase();
    for (let n = lw.length - 1; n >= Math.max(4, lw.length - 4); n--) if (knownWord(lw.slice(0, n))) return w;
    // a capitalised word in the middle of a sentence is probably a name — leave it alone
    if (/^[A-ZА-ЯЁ]/.test(w) && w.length > 1 && !/^[A-ZА-ЯЁ]+$/.test(w)) {
      const b = bestWord(w); if (!b || osaDistance(w.toLowerCase().replace(/ё/g, 'е'), b.replace(/ё/g, 'е')) > 1) return w;
      fixes.push([w, b]); return b[0].toUpperCase() + b.slice(1);
    }
    const b = bestWord(w); if (!b) return w;
    fixes.push([w, b]); return b;
  });
  autocorrect.fixes = fixes;
  return out;
}

// ---------- AI text understanding (EN + RU) ----------
const LOST_RE  = /(\blost\b|\blose\b|\bloose\b|\blosing\b|\blsot\b|missing|ran away|run away|runaway|escaped|flew away|flown away|disappeared|gone missing|is gone|went missing|can.?t find|cannot find|didn.?t come (back|home)|hasn.?t come (back|home)|потерял|потерялся|потерялась|потеря|пропал|пропала|пропали|убежал|убежала|сбежал|сбежала|улетел|улетела|исчез|исчезла|не вернул|не могу найти|не можем найти|ищу (свою |своего |мою |моего )?(собак|пс|кош|кот|щен|питом|попуга|птиц|кролик|хомяк))/i;
// other animals besides cats & dogs
const OTHER_SPECIES = [
  ['bird',       /(bird|parrot|budgie|budgerigar|canary|cockatiel|cockatoo|parakeet|попуга|птиц|птичк|канарейк|волнист|корелл)/i],
  ['rabbit',     /(rabbit|bunny|кролик|крольчих|зайчик)/i],
  ['hamster',    /(hamster|хомяк|хомячок)/i],
  ['guinea pig', /(guinea pig|морск\w* свинк)/i],
  ['ferret',     /(ferret|хорёк|хорек|хорьк)/i],
  ['turtle',     /(turtle|tortoise|черепах)/i],
  ['snake',      /(snake|змея|змею|уж\b|питон)/i],
  ['horse',      /(horse|pony|лошад|пони)/i],
  ['lizard',     /(lizard|gecko|iguana|chameleon|bearded dragon|ящериц|геккон|игуан|хамелеон|агам)/i],
  ['frog',       /(frog|toad|лягушк|жаб)/i],
  ['rat',        /(\brats?\b|крыс)/i],
  ['mouse',      /(\bmouse\b|\bmice\b|мышк|мышь|мыша)/i],
  ['chinchilla', /(chinchilla|шиншилл)/i],
  ['hedgehog',   /(hedgehog|ёжик|ежик|\bёж\b|\bеж\b|ежа)/i],
  ['goat',       /(\bgoat|козу|коза|козл)/i],
];
const FOUND_RE = /(found|stray|spotted|i saw|нашел|нашёл|нашла|нашли|подобрал|подобрала|бездомн|бродяч|увидел[аи]? (собак|пс|кош|кот|щен)|бегает (собак|пс|кош|кот)|потерявш|чья (собак|кошк))/i;
// Services & Care topics, Shop categories — first match wins
const SVC_TOPICS = [
  ['Vaccinations', /(vaccin|shot|jab|rabies|прививк|вакцин|бешенств)/i],
  ['Vet visit',    /(\bvet\b|veterin|clinic|doctor|sick|\bill\b|vomit|diarr|injur|limp|fever|check.?up|ветеринар|ветклиник|клиник|врач|болеет|заболел|рвот|понос|травм|температур|осмотр|анализ|стерилиз|кастрац|чипирован)/i],
  ['Grooming',     /(groom|haircut|bath|nail|стрижк|груминг|подстри|помыть|купать|когт)/i],
  ['Dog walking',  /(walk|walker|выгул|погулять)/i],
  ['Pet sitting',  /(sitter|sitting|boarding|hotel|vacation|holiday|передерж|присмотр|посидеть|зоогостиниц|отпуск|уезжаю)/i],
  ['Training',     /(train|behavio|bark|bite|obedien|дрессир|воспитан|кинолог|лает|кусает|поведени)/i],
  ['Insurance',    /(insur|страхов)/i],
];
const SHOP_CATS = [
  ['Food',              /(food|kibble|feed|корм|еда|кормить|питани)/i],
  ['Treats',            /(treat|snack|лакомств|вкусняшк)/i],
  ['Toys',              /(toy|ball|игрушк|мячик)/i],
  ['Leashes & collars', /(leash|lead|collar|harness|поводок|ошейник|шлейк|рулетк)/i],
  ['Litter',            /(litter|наполнител|лоток)/i],
  ['Beds',              /(\bbed\b|cushion|лежанк|лежак|домик)/i],
  ['Bowls',             /(bowl|feeder|миск|поилк)/i],
  ['Carriers',          /(carrier|crate|переноск|клетк)/i],
  ['Care products',     /(shampoo|brush|flea|tick|шампун|расчёск|расческ|от блох|клещ)/i],
];
const SHOP_RE = /(\bbuy\b|purchase|order|\bshop|store|price|купить|куплю|заказать|магазин|цена|сколько стоит)/i;
const ADOPT_RE = /(adopt|rescue|shelter|усынов|приют|завести|взять (себе |из приюта )?(собак|кош|кот|щен|питом)|хочу (собак|кош|котён|котен|щен|питом|кот)|want (a|to get a) (dog|cat|puppy|kitten|pet)|get a (dog|cat|puppy|kitten|pet)|looking for a (new )?(dog|cat|puppy|kitten|pet|friend)|new (friend|pet)|ищу (щенка|котёнка|котенка|питомца))/i;
const firstMatch = (list, v) => (list.find(([, re]) => re.test(v)) || [null])[0];
function detectIntent(v) {
  if (LOST_RE.test(v) && !/(потерявш|чья (собак|кошк)|кто.{0,20}потерял)/i.test(v)) return 'lost';
  if (FOUND_RE.test(v)) return 'found';
  if (ADOPT_RE.test(v)) return 'adoption';
  if (firstMatch(SVC_TOPICS, v)) return 'services';
  if (SHOP_RE.test(v) || firstMatch(SHOP_CATS, v)) return 'shop';
  return null;
}
const NAME_STOP = new Set(['Возле','Около','Рядом','Сегодня','Вчера','Утром','Вечером','Она','Он','Его','Её','Ее','Это','Мы','Я','Около','Near','About','The','He','She','It','Today','Yesterday','His','Her','In','At','On','My','I','Our','A','An','This','That','Help','Please','Hi','Hello','Lost','Missing','Black','White','Grey','Gray','Brown','Ginger','Orange','Small','Big','Little','Old','Young','Fluffy','Мою','Моего','Мой','Мою','Нашу','Нашего','Свою','Своего','Рыжую','Рыжего','Черную','Чёрную','Черного','Чёрного','Белую','Белого','Серую','Серого','Маленькую','Маленького','Большую','Большого','Помогите','Привет','Срочно']);
const cap = s => s.replace(/^./, c => c.toUpperCase());
function normPlace(p) {
  const NOM = { 'парке': 'парк', 'сквере': 'сквер', 'улице': 'улица', 'лесу': 'лес', 'дворе': 'двор', 'доме': 'дом', 'районе': 'район', 'пляже': 'пляж', 'озере': 'озеро', 'площади': 'площадь', 'набережной': 'набережная', 'станции': 'станция', 'школы': 'школа', 'школе': 'школа', 'магазина': 'магазин', 'остановки': 'остановка', 'метро': 'метро', 'подъезда': 'подъезд', 'парка': 'парк', 'сквера': 'сквер', 'дома': 'дом' };
  // a place never ends with a time ("near the park this morning")
  // dictated speech has no commas: a place ends where the next clause starts ("…near the station she is small…")
  p = p.replace(/\s+(?:she|he|it|they|and|but|who|which|wearing|with (?:a|an|her|his)\b|around \d|about \d|at \d|when)\b.*$/i, '').trim();
  p = p.replace(/\s+(this (morning|afternoon|evening)|tonight|today\b.*|yesterday\b.*|last night|on (mon|tues|wednes|thurs|fri|satur|sun)day\b.*|at \d.*|around \d.*|just now|an? hours? ago|\d+\s*(hours?|minutes?|days?) ago|утром|днём|днем|вечером|ночью|сегодня.*|вчера.*|позавчера.*|в \d.*|только что|час назад)\s*$/i, '').trim();
  const [w, ...rest] = p.split(/\s+/);
  return cap([NOM[w.toLowerCase()] || w, ...rest].join(' '));
}
function sentences(raw) { return raw.split(/(?<=[.!?\n])\s+/).map(s => s.trim()).filter(Boolean); }

const RULE = { COLOUR: 2, LOOKALIKE: 1, NEAR_KM: 2, NEAR: 2, SIZE: 1, FRESH_DAYS: 7, FRESH: 1, OLD_DAYS: 30, OLD: -2, MATCH_AT: 5, MAYBE_AT: 2 };
const LOOKALIKE = [['white', 'cream'], ['black', 'dark grey'], ['brown', 'ginger']];
// demo found-pet reports around the last-seen spot (made up; km and bearing from the spot, days ago)
const FOUND_REPORTS = [
  { sp: 'dog', colour: 'black', size: 'medium', km: 0.4, bearing: 40, daysAgo: 0, where: 'Praça do Chile', desc: 'black dog, medium size' },
  { sp: 'dog', colour: 'brown', size: 'small', km: 1.1, bearing: 200, daysAgo: 1, where: 'Jardim do Torel', desc: 'small brown dog' },
  { sp: 'dog', colour: 'cream', size: 'large', km: 2.6, bearing: 320, daysAgo: 3, where: 'Campo de Ourique', desc: 'large cream dog' },
  { sp: 'cat', colour: 'ginger', size: 'small', km: 0.7, bearing: 120, daysAgo: 0, where: 'Rua Pascoal de Melo', desc: 'small ginger cat' },
  { sp: 'cat', colour: 'grey', size: 'small', km: 6, bearing: 80, daysAgo: 1, where: 'Parque das Nações', desc: 'small grey cat' },
  { sp: 'bird', colour: 'green', size: 'small', km: 1.5, bearing: 250, daysAgo: 2, where: 'Jardim da Estrela', desc: 'green parrot' },
];
// other people's lost pets nearby (demo) — shown on the No-match map
const LOST_REPORTS = [
  { sp: 'dog', desc: 'Lost · small tan dog · Pip', km: 0.6, bearing: 300, daysAgo: 2 },
  { sp: 'cat', desc: 'Lost · grey tabby · Migas', km: 1.0, bearing: 150, daysAgo: 5 },
];
const atBearing = (c, km, deg) => { const r = deg * Math.PI / 180; return [c[0] + km / 111 * Math.cos(r), c[1] + km / (111 * Math.cos(c[0] * Math.PI / 180)) * Math.sin(r)]; };
// what the owner told us, in the rule's words

function ruleClues(lost, f) {
  const p = [];
  if (lost.colour && lost.colour === f.colour) p.push(['Same colour', RULE.COLOUR]);
  else if (lost.colour && LOOKALIKE.some(([a, b]) => (a === lost.colour && b === f.colour) || (b === lost.colour && a === f.colour))) p.push(['Colour looks alike in photos', RULE.LOOKALIKE]);
  if (f.km <= RULE.NEAR_KM) p.push([`Found ${f.km < 1 ? Math.round(f.km * 1000) + ' m' : f.km + ' km'} from where it went missing`, RULE.NEAR]);
  if (lost.size && lost.size === f.size) p.push(['Same size', RULE.SIZE]);
  const days = Math.round((Date.now() - f.daysAgo * 864e5 - lost.lostDay) / 864e5);
  if (days <= RULE.FRESH_DAYS) p.push([days <= 0 ? 'Found the same day' : `Found ${days} day${days > 1 ? 's' : ''} later — a fresh lead`, RULE.FRESH]);
  else if (days > RULE.OLD_DAYS) p.push([`Found ${days} days later`, RULE.OLD]);
  return p;
}
function ruleVerdict(lost, f) {
  if (lost.sp !== f.sp) return { verdict: 'no', clues: [], score: 0 };
  if (Date.now() - f.daysAgo * 864e5 < lost.lostDay - 864e5 / 2) return { verdict: 'no', clues: [], score: 0 }; // found before it went missing
  const clues = ruleClues(lost, f), score = clues.reduce((a, [, p]) => a + p, 0);
  return { verdict: score >= RULE.MATCH_AT ? 'match' : score >= RULE.MAYBE_AT ? 'maybe' : 'no', clues, score };
}
// the best found report for this lost pet (most points; on a tie the colour clue, then the nearest)

const TIPS = {
  common: ['Walk the area at dawn and dusk — it’s quiet, call {n}’s name calmly', 'Leave something that smells of home by the door', 'Ask neighbours to check garages, sheds and basements', 'Share the poster in local groups'],
  cat: 'Cats usually hide close by — check under cars and in basements within 500 m',
  dog: 'Dogs can travel far — widen the search to 2–3 km and check parks',
  bird: 'Look up — trees, balconies, rooftops. Play its favourite sounds',
  rabbit: 'Rabbits hide low and stay still — check hedges and under decks',
};
const CITY_LL = {
  lisbon: [38.7223, -9.1393], lisboa: [38.7223, -9.1393], 'лиссабон': [38.7223, -9.1393], porto: [41.1579, -8.6291], 'порту': [41.1579, -8.6291],
  madrid: [40.4168, -3.7038], barcelona: [41.3874, 2.1686], paris: [48.8566, 2.3522], 'париж': [48.8566, 2.3522], london: [51.5072, -0.1276], 'лондон': [51.5072, -0.1276],
  berlin: [52.52, 13.405], 'берлин': [52.52, 13.405], rome: [41.9028, 12.4964], milan: [45.4642, 9.19], amsterdam: [52.3676, 4.9041], vienna: [48.2082, 16.3738],
  prague: [50.0755, 14.4378], warsaw: [52.2297, 21.0122], belgrade: [44.7866, 20.4489], 'белград': [44.7866, 20.4489], istanbul: [41.0082, 28.9784], 'стамбул': [41.0082, 28.9784],
  tbilisi: [41.7151, 44.8271], 'тбилиси': [41.7151, 44.8271], yerevan: [40.1792, 44.4991], 'ереван': [40.1792, 44.4991], almaty: [43.2389, 76.8897], 'алматы': [43.2389, 76.8897],
  dubai: [25.2048, 55.2708], 'new york': [40.7128, -74.006], 'los angeles': [34.0522, -118.2437], toronto: [43.6532, -79.3832], kyiv: [50.4501, 30.5234], 'киев': [50.4501, 30.5234],
  minsk: [53.9006, 27.559], 'минск': [53.9006, 27.559], moscow: [55.7558, 37.6173], 'москва': [55.7558, 37.6173], 'saint petersburg': [59.9343, 30.3351],
  'санкт-петербург': [59.9343, 30.3351], 'питер': [59.9343, 30.3351], 'казань': [55.7961, 49.1064], 'новосибирск': [55.0084, 82.9357], 'екатеринбург': [56.8389, 60.6057],
  'нижний новгород': [56.2965, 43.9361], 'самара': [53.1959, 50.1002], 'краснодар': [45.0355, 38.9753], 'сочи': [43.6028, 39.7342],
};

// ---------- functions that read or change a lost-report draft (S) ----------
export function bindReport(S) {
  const F = k => S.fields.find(f => f.k === k);
  const setPet = n => { S.pet = n; F('name').v = n; };
  const $$ = () => [];
  function applyWhen(w) {
    const f = F('time');
    Object.assign(f, { chip: w.chip || null, date: w.date || null, part: w.part || null, exact: w.exact || null, s: 'check' });
    f.v = w.chip ? timeFromChip(w.chip) : dayLabel(f);
    // light up the matching quick choice ("yesterday evening" → Yesterday)
    if (!w.chip && f.date) { const y = new Date(); y.setDate(y.getDate() - 1); f.chip = f.date === isoDay(new Date()) ? 'Today' : f.date === isoDay(y) ? 'Yesterday' : null; }
  }

  function parseStory(raw, { merge = false, asked = null } = {}) {
    const found = {};
    if (!merge) {
      S.transcript = raw; S.pet = ''; S.species = null; S.place = null; S.saidPlace = null; S.mark = null; S.skipped = []; S.memberAsked = false; S.lostPin = null; S.photoNote = null; S.optionalMode = false; $$('[data-details]').forEach(d => { d.dataset.map = ''; });
      S.fields.forEach(f => Object.assign(f, { v: '', s: f.req ? 'missing' : 'optional', fromPhoto: false, chip: null, date: null, part: null, exact: null }));
      S.lostPhoto = null; S.photoKind = null; S.photoLook = null; S.photoBreed = null; S.photoColour = null;
    } else S.transcript += ' ' + raw;
  
    // species
    const isCat = /(кошк|кошеч|котик|котён|котен|(^|[^а-яё])кот([^а-яё]|$|а|у|ом|е|ик|ика)|\bcats?\b|kitten|kitty|siamese|persian|maine coon|ragdoll|bengal|sphynx|british shorthair|\btabby\b)/i.test(raw);
    const isDog = /(собак|собач|пёс|(^|[^а-яё])пс[аы]|(^|[^а-яё])пес([^а-яё]|$)|псин|щен|\bdogs?\b|puppy|doggy|retriever|labrador|\blab\b|shepherd|husky|poodle|terrier|spaniel|beagle|bulldog|chihuahua|dachshund|collie|\bpug\b|corgi|boxer|rottweiler|doberman|schnauzer|podenco|greyhound|whippet|pointer|setter|mastiff|malinois|shih tzu|cocker)/i.test(raw);
    if (isDog || isCat) S.species = isDog && !(isCat && raw.search(/cat|кош|кот/i) < raw.search(/dog|собак|пёс|пес|щен/i)) ? 'dog' : 'cat';
    else { const o = OTHER_SPECIES.find(([, re]) => re.test(raw)); if (o) S.species = o[0]; }
    if (S.species && F('species').s !== 'ok' && (isDog || isCat || OTHER_SPECIES.some(([, re]) => re.test(raw)))) {
      Object.assign(F('species'), { v: cap(S.species), s: 'check' }); found.species = cap(S.species);
    }
  
    // name — normalise species words to lower case so a capitalised name stands out ("I lost Luna Cat")
    const SP_A = '(?:cats?|dogs?|kitten|kitty|puppy|pet|lizards?|gecko|iguana|chameleon|frogs?|rats?|mouse|chinchilla|hedgehog|goats?|ящериц[аеуыой]*|геккон[аеуом]*|игуан[аеуыой]*|хамелеон[аеуом]*|лягушк[аеуиой]*|крыс[аеуыой]*|мышк[аеуиой]*|шиншилл[аеуыой]*|ёжик[аеуом]*|ежик[аеуом]*|birds?|parrots?|budgie|canary|cockatiel|cockatoo|parakeet|rabbits?|bunny|hamsters?|guinea pig|ferrets?|turtles?|tortoise|snakes?|horses?|pony|попуга[йяюем]*|птиц[аеуыой]*|птичк[аеуиой]*|канарейк[аеуиой]*|кролик[аеуом]*|хомяк[аеуом]*|хомячк[аеуом]*|черепах[аеуиой]*|хорёк|хорек|хорьк[аеуом]*|';
    const SP_REST = 'кошк[аиуеой]?|кошечк[аиуеой]?|кот[аиуеом]*|котик[аиуеом]*|котёнк[аиуеом]*|котенк[аиуеом]*|котёнок|котенок|собак[аиуеой]?|собачк[аиуеой]?|пс[аы]|пёс|пес|щенк[аиуеом]*|щенок)';
    const SP = SP_A + SP_REST;
    const low = raw.replace(new RegExp(SP, 'gi'), m => m.toLowerCase());
    const N = '([A-ZА-ЯЁ][a-zа-яё]+)';
    const nameRes = [
      /(?:зовут|кличк[аеуи]|по имени|имя)\s*[:\-—]?\s*[«"]?([А-ЯЁA-Zа-яёa-z][а-яёa-z]+)/,
      /(?:named|called|name is|name's)\s+(?:is\s+)?([A-Za-z][a-z]+)/,
      new RegExp(`${SP}\\s+[«"]?${N}`),                                   // "my cat Luna", "собаку Рекс"
      new RegExp(`${N}\\s+(?:the\\s+|my\\s+)?${SP}(?![a-zа-яё])`),         // "Luna Cat", "Luna the cat"
      new RegExp(`(?:lost|missing|потерял[аи]?|пропал[аи]?|ищу)\\s+(?:my\\s+|our\\s+)?${N}`), // "I lost Luna"
      new RegExp(`${N}\\s+(?:is missing|ran away|escaped|went missing|пропал[аи]?|убежал[аи]?|потерял[ао]?сь)`), // "Luna ran away"
    ];
    for (const re of nameRes) {
      const m = low.match(re);
      if (m && !NAME_STOP.has(cap(m[1])) && !new RegExp(`^${SP}$`, 'i').test(m[1])) { const n = cap(m[1]); setPet(n); F('name').s = 'check'; found.name = n; break; }
    }
    // fallback for lower-case names: the word right after the animal word ("my cat sunrise ran away", "кошку мурка"),
    // as long as it isn't an ordinary word (verb, time, place word…)
    if (!found.name) {
      const NOT_NAME = /^(ran|run|runs|is|was|has|had|got|went|left|escaped|missing|lost|gone|flew|disappeared|from|near|at|in|on|today|yesterday|this|last|since|and|but|who|that|which|with|without|please|help|убежал[аи]?|сбежал[аи]?|пропал[аи]?|потерял[аи]?сь|улетел[аи]?|ушл[аи]|ушёл|ушел|вчера|сегодня|утром|вечером|возле|около|рядом|у|в|на|из|с|и|а|но|которая|который|которую|по|кличке|зовут|породы)$/i;
      const m = low.match(new RegExp(`${SP}\\s+(?:named\\s+|called\\s+|по кличке\\s+)?([a-zа-яё][a-zа-яё-]+)`, 'i'));
      if (m && !NOT_NAME.test(m[1]) && !knownWord(m[1].toLowerCase()) && !new RegExp(`^${SP}$`, 'i').test(m[1])) {
        const n = cap(m[1]); setPet(n); F('name').s = 'check'; found.name = n;
      }
    }
  
    // time
    const tm = raw.match(/((около|примерно|где-то|почти)\s+)?(\d+|пол|полтора|два|две|три|несколько|час|пару)?\s*(минут[уы]?|час[аов]*|дн[яей]+|день)\s+назад|только что|час назад|вчера( утром| днём| днем| вечером| ночью)?|сегодня( утром| днём| днем| вечером| ночью)?|с утра|этой ночью|позавчера|((about|around)\s+)?(an?|\d+|a few)\s+(hours?|minutes?|days?)\s+ago|yesterday( morning| evening)?|this morning|tonight|today|just now/i);
    const when = parseWhen(raw);
    if (when && (!when.weak || !F('time').v || !asked || asked === 'time')) { applyWhen(when); found.time = F('time').v; }
    else if (tm) { const ch = chipFromText(tm[0]); Object.assign(F('time'), { v: ch ? timeFromChip(ch) : cap(tm[0].trim()), s: 'check', chip: ch, date: null, part: null, exact: null }); found.time = F('time').v; }
  
    // place
    let pm = raw.match(/(?:возле|около|рядом с|недалеко от|у|в|на|во)\s+((?:парк|сквер|улиц|ул\.|проспект|пр\.|бульвар|двор|дом|подъезд|метро|станци|площад|набережн|лес|роще|школ|магазин|тц|торгов|остановк|пляж|озер|реки|район)[^.,!?\n]*)/i)
      || raw.match(/(?:возле|около|рядом с|недалеко от)\s+([^.,!?\n]+)/i)
      || raw.match(/\b(?:near|next to|behind|outside|close to|opposite|from)\s+(?!\d)((?:the\s+|a\s+|our\s+|my\s+)?[^.,!?\n\d]*?\b(?:park|street|st|road|rd|avenue|ave|square|station|school|shop|store|supermarket|market|beach|river|garden|gardens|playground|bridge|church|mall|cafe|café|house|home|building|parking|car park|lake|forest|woods|bus stop|stop|metro|corner|rua|avenida|praça|largo|jardim|parque)\b[^.,!?\n]*)/i)
      || raw.match(/\b(?:at|in|around|by)\s+(?!\d)((?:the\s+|a\s+|our\s+|my\s+)?[^.,!?\n\d]*?\b(?:park|street|st|road|rd|avenue|ave|square|station|school|shop|store|supermarket|market|beach|river|garden|gardens|playground|bridge|church|mall|cafe|café|house|home|building|parking|car park|lake|forest|woods|bus stop|stop|metro|corner|rua|avenida|praça|largo|jardim|parque)\b[^.,!?\n]*)/i)
      || raw.match(/\b(?:near|at|around|by|next to)\s+((?:the\s+)?[A-Z][^.,!?\n]*)/);
    // city / area — from a list of known cities (any grammatical case: "в Москве", "in Lisbon")
    const city = findCity(raw);
    if (city && F('city').s !== 'ok') { Object.assign(F('city'), { v: city, s: 'check' }); found.city = city; }
    if (pm && city && new RegExp(`^${city.slice(0, 4)}`, 'i').test(pm[1].trim())) pm = null; // "in Lisbon" is the city, not an exact place
    if (pm && city) pm[1] = pm[1].replace(new RegExp(`[,\\s]+(?:in|в|во)\\s+${city.slice(0, 4)}[\\p{L}]*`, 'iu'), '');
    if (pm) { S.saidPlace = normPlace(pm[1].trim()); Object.assign(F('lost'), { v: S.saidPlace, s: 'check' }); found.place = S.saidPlace; }
  
    // collar / chip
    const chipS = sentences(raw).flatMap(s => s.split(/,\s+|;\s+/)).find(s => /(ошейник|чип|жетон|адресник|collar|chip|tag)/i.test(s));
    if (chipS) {
      // just the collar / chip part: "with a red collar" → "Red collar"
      const part = (chipS.match(/(?<![\p{L}])(?:with|has|wearing|wears|с|в)\s+((?:an?\s+)?[^,.;]*?(?:ошейник|чип|жетон|адресник|collar|chip|tag)[\p{L}]*[^,.;]*)/iu) || [, chipS])[1];
      const clean = part.replace(/\s+(?:my|our)\s+(?:number|phone|mobile|email|contact)\b.*$|\s+(?:call|text|email|message)\s+me\b.*$|\s+(?:she|he|it)\s+(?:is|was|ran|went)\b.*$|\s+\+?\d[\d\s()-]{6,}.*$/i, '');
      Object.assign(F('chip'), { v: cap(clean.replace(/^an?\s+/i, '').replace(/[.!]$/, '').trim()), s: 'check' }); found.chip = true;
    }
  
    // characteristics
    const TRAIT_RE = /(рыж|черн|чёрн|бел[аоыя]|коричнев|сер[аоыя]|сер[ыо]й|пятн|полосат|трёхцвет|трехцвет|золотист|бежев|рыжев|маленьк|средн|больш|крупн|пушист|гладкошерст|длинношерст|хвост|уш|шрам|хромает|порода|метис|лабрадор|овчарк|такс|хаски|спаниел|терьер|пудель|brown|black|white|grey|gray|golden|spotted|small|medium|large|big|fluffy|scar|breed)/i;
    // only the parts of the message that describe the animal — not "I lost…", the place or the time
    const LOSS_RE = /(lost|missing|ran away|run away|escaped|went missing|пропал|потерял|убежал|сбежал|ищу)/i;
    const clauses = sentences(raw).flatMap(s => s.split(/,\s+|;\s+|\s+(?=(?:she|he|it|он|она)\s+(?:is|has|was|'s|looks|wears|has got|—|-)?\b)/i));
    const traits = clauses.filter(s => TRAIT_RE.test(s.replace(/(red|black|white|brown|красн|черн|чёрн|бел)\w*\s+(collar|ошейник)\w*/gi, '')) && !LOSS_RE.test(s) && !(pm && s.includes(pm[1].trim())) && !(parseWhen(s) && !/(рыж|черн|чёрн|бел|коричнев|сер|black|white|brown|grey|gray|big|small|large)/i.test(s)));
    if (traits.length) {
      const t = traits.map(s => s.replace(/^.*?(?<![\p{L}])(?=(он|она|оно|he|she|it)\s)/iu, '').replace(/[.!]+$/, '')).join(', ');
      const t2 = t.replace(/\b(her|his|its|the|my)?\s*(cat'?s|dog'?s|pet'?s)?\s*name[ds]?\s*(is\s+)?[A-ZА-ЯЁ][a-zа-яё]+[,.]?\s*/gi, '').replace(/(my\s+)?(number|phone|email)[^.]*\.?/gi, '').replace(/\s+/g, ' ').replace(/^[,.\s]+|[,\s]+$/g, '').replace(/^./, c => c.toUpperCase());
      F('traits').v = merge && F('traits').v ? F('traits').v + ' ' + t2 : t2;
      F('traits').s = 'check'; found.traits = true;
    } else if (merge && raw && !asked && !found.name && !found.time && !found.place && !found.chip && !found.species && !found.city) {
      F('traits').v = (F('traits').v ? F('traits').v + ' ' : '') + raw; F('traits').s = 'check';
    }
    return found;
  }
  

  function lostForRule() {
    const look = [F('traits').v, S.photoColour, S.photoLook].filter(Boolean).join(' ').toLowerCase();
    const COL = [['dark grey', /dark gr[ae]y|charcoal/], ['black', /black|черн|чёрн/], ['white', /white|бел[аоы]/], ['cream', /cream|beige/], ['grey', /gr[ae]y|silver|tabby|сер[аоы]/],
      ['brown', /brown|chocolate|\btan\b|reddish|коричнев/], ['ginger', /ginger|orange|golden|рыж/], ['green', /green|зел[её]н/]];
    const hit = COL.map(([c, re]) => { const m = look.match(re); return m ? [c, m.index] : null; }).filter(Boolean).sort((a, b) => a[1] - b[1])[0];
    const size = /\b(small|little|tiny|kitten|puppy)\b|маленьк/.test(look) ? 'small' : /\b(medium|mid-size)\b|средн/.test(look) ? 'medium' : /\b(large|big|huge)\b|больш|крупн/.test(look) ? 'large' : null;
    const t = F('time'), y = new Date(); y.setDate(y.getDate() - 1);
    const lostDay = t.date ? new Date(t.date + 'T12:00') : t.chip === 'Yesterday' ? y : new Date();
    return { sp: (S.species || '').toLowerCase(), colour: hit ? hit[0] : null, size, lostDay };
  }
  // the points each clue gives, as [clue, points] — same order and wording as the lab

  function searchFound() {
    const lost = lostForRule();
    const ranked = FOUND_REPORTS.map(f => Object.assign({ f, lost }, ruleVerdict(lost, f))).filter(r => r.verdict !== 'no')
      .sort((a, b) => b.score - a.score || (b.clues.some(c => /colour/i.test(c[0])) - a.clues.some(c => /colour/i.test(c[0]))) || a.f.km - b.f.km);
    return ranked[0] ? Object.assign(ranked[0], { desc: ranked[0].f.desc }) : null;
  }
  
  // ---------- no match yet ----------
  return { applyWhen, parseStory, lostForRule, searchFound };
}

export {
  TIME_CHIPS, DAY_PARTS, fmtDay, fmtHM, timeFromChip, chipFromText, isoDay, dayLabel, partOfHour, parseWhen,
  PLACES, CITIES, findCity, colourName, KINDS, autocorrect, osaDistance, knownWord, detectIntent, firstMatch,
  SVC_TOPICS, SHOP_CATS, OTHER_SPECIES, cap, normPlace, sentences,
  RULE, LOOKALIKE, FOUND_REPORTS, LOST_REPORTS, atBearing, ruleClues, ruleVerdict, TIPS, CITY_LL,
};

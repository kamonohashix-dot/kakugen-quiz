export const CALENDAR_EVENTS = [
  { month: 1,  day: 17, year: 1995, type: 'crash',         title: '阪神大震災',                kakugen: ['休むも相場', '天災は忘れた頃にやってくる'] },
  { month: 2,  day: 27, year: 2007, type: 'crash',         title: '世界同時株安',               kakugen: ['落ちるナイフはつかむな'] },
  { month: 3,  day: 11, year: 2011, type: 'crash',         title: '東日本大震災',               kakugen: ['天災は忘れた頃にやってくる', '休むも相場'] },
  { month: 3,  day: 23, year: 2020, type: 'rally',         title: 'コロナショック底打ち',        kakugen: ['人の行く裏に道あり花の山', '総悲観は買い'] },
  { month: 6,  day: 24, year: 2016, type: 'crash',         title: 'Brexit国民投票',             kakugen: ['噂で買って事実で売れ'] },
  { month: 8,  day: 5,  year: 2024, type: 'crash',         title: '令和のブラックマンデー',     kakugen: ['落ちるナイフはつかむな', '休むも相場'] },
  { month: 9,  day: 15, year: 2008, type: 'crash',         title: 'リーマン・ブラザーズ破綻',   kakugen: ['落ちるナイフはつかむな', '現金はポジションである'] },
  { month: 10, day: 19, year: 1987, type: 'crash',         title: 'ブラックマンデー',           kakugen: ['頭と尻尾はくれてやれ'] },
  { month: 10, day: 24, year: 1929, type: 'crash',         title: '暗黒の木曜日',               kakugen: ['歴史は韻を踏む'] },
  { month: 12, day: 29, year: 1989, type: 'turning_point', title: '日経平均史上最高値 38,957円', kakugen: ['山高ければ谷深し', '強気相場は絶望の中で生まれる'] },
]

export function getEventIcon(type) {
  if (type === 'crash')         return '🔴'
  if (type === 'rally')         return '🟢'
  if (type === 'turning_point') return '🟡'
  return '⚪'
}

import assert from 'node:assert/strict';
import test from 'node:test';

import { detectLanguage } from '../src/detect.js';
import { getLanguage } from '../src/languages.js';

const SAMPLES = {
  he: 'שלום לכולם, היום נדבר על איך מכינים כתוביות לסרטון בצורה חינמית לגמרי',
  en: 'And so my fellow Americans, ask not what your country can do for you',
  ar: 'مرحبا بكم جميعا، اليوم سوف نتحدث عن كيفية إنشاء الترجمة للفيديو',
  ru: 'Привет всем, сегодня мы поговорим о том, как сделать субтитры для видео',
  uk: 'Привіт усім, сьогодні ми поговоримо про те, як зробити субтитри для відео',
  es: 'Hola a todos, hoy vamos a hablar de cómo crear subtítulos para un vídeo',
  fr: 'Bonjour à tous, aujourd’hui nous allons parler de la création des sous-titres',
  de: 'Hallo zusammen, heute sprechen wir darüber, wie man Untertitel für ein Video erstellt',
  pt: 'Olá a todos, hoje vamos falar sobre como criar legendas para um vídeo não é difícil',
  it: 'Ciao a tutti, oggi parliamo di come si creano i sottotitoli per un video che non è difficile',
  pl: 'Cześć wszystkim, dzisiaj porozmawiamy o tym jak nie jest trudno zrobić napisy do filmu',
  tr: 'Herkese merhaba, bugün bir video için altyazı nasıl yapılır bunu konuşacağız ve daha çok',
  ja: 'みなさんこんにちは、今日は動画の字幕の作り方について話します',
  ko: '여러분 안녕하세요, 오늘은 영상 자막 만드는 방법에 대해 이야기하겠습니다',
  zh: '大家好，今天我们来聊聊如何为视频制作字幕',
  el: 'Γεια σας σε όλους, σήμερα θα μιλήσουμε για το πώς φτιάχνουμε υπότιτλους',
  hi: 'सभी को नमस्कार, आज हम बात करेंगे कि वीडियो के लिए सबटाइटल कैसे बनाते हैं',
  th: 'สวัสดีทุกคน วันนี้เราจะมาพูดถึงวิธีทำคำบรรยายสำหรับวิดีโอ',
  fa: 'سلام به همه، امروز درباره ساخت زیرنویس برای ویدیو صحبت می‌کنیم و چگونه',
  nl: 'Hallo allemaal, vandaag hebben we het over hoe je ondertiteling voor een video maakt niet moeilijk',
  vi: 'Xin chào tất cả mọi người, hôm nay chúng ta sẽ nói về cách làm phụ đề cho video của bạn',
};

for (const [expected, sample] of Object.entries(SAMPLES)) {
  test(`detectLanguage identifies ${expected}`, () => {
    assert.equal(detectLanguage(sample), expected);
  });
}

test('detectLanguage always returns a code from the table', () => {
  for (const sample of Object.values(SAMPLES)) {
    assert.ok(getLanguage(detectLanguage(sample)), `unknown code for: ${sample.slice(0, 20)}`);
  }
});

test('detectLanguage falls back to English on empty input', () => {
  assert.equal(detectLanguage(''), 'en');
  assert.equal(detectLanguage(null), 'en');
  assert.equal(detectLanguage('12345 !!! ???'), 'en');
});

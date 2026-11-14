// Типограф: убирает «висячие» предлоги, союзы и частицы в конце строки —
// склеивает короткое слово со следующим неразрывным пробелом, а перед тире ставит неразрывный пробел.
// Обрабатывает только текст между тегами; script, style и textarea не трогает.
const NBSP = ' ';
const short = [
  'и', 'а', 'но', 'да', 'или', 'в', 'во', 'к', 'ко', 'с', 'со', 'у', 'о', 'об', 'обо', 'от', 'до', 'на', 'по', 'за', 'из', 'изо',
  'не', 'ни', 'для', 'без', 'при', 'под', 'над', 'про', 'что', 'как', 'же', 'я', 'мы', 'вы',
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'at', 'by', 'for', 'and', 'or', 'i', 'my', 'is',
];
const reWord = new RegExp(`(^|[\\s(«"„“—-]|&nbsp;)(${short.join('|')})[ \\t\\n]+(?=\\S|$)`, 'giu');

function fixText(text) {
  let out = text;
  for (let k = 0; k < 2; k++) out = out.replace(reWord, (m, pre, w) => `${pre}${w}${NBSP}`); // дважды — для «и в»
  return out.replace(/[ \t\n]+(—|–)/g, `${NBSP}$1`);
}

module.exports = function typograph(html) {
  return html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<textarea[\s\S]*?<\/textarea>)/i)
    .map((chunk, i) => (i % 2 ? chunk : chunk.replace(/>([^<]+)</g, (m, txt) => `>${fixText(txt)}<`)))
    .join('');
};

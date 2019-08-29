export function addStartingSlash(text: string) {
  if (!text) {
    return text;
  }
  return text[0] !== '/' ? '/' + text : text;
}

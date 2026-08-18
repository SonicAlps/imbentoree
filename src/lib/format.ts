export function toCamelCaseName(name: string): string {
  return name
    .trim()
    .split(/\s+/)                // split on any whitespace
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("")
    .replace(/[^a-zA-Z0-9]/g, ""); // strip anything that isn't a letter/number
}
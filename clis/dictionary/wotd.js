import { cli, Strategy } from "@jackwener/opencli/registry";
import { CliError } from "@jackwener/opencli/errors";

cli({
  site: "dictionary",
  name: "wotd",
  description: "Dictionary.com Word of the Day",
  strategy: Strategy.PUBLIC,
  browser: false,
  args: [
    {
      name: "limit",
      type: "int",
      default: 1,
      help: "Number of recent words (default 1)",
    },
  ],
  columns: ["date", "word", "pos", "phonetic", "definition", "example"],
  func: async (_page, args) => {
    const limit = Math.max(1, Math.min(Number(args.limit) || 1, 20));

    const res = await fetch("https://www.dictionary.com/word-of-the-day", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });
    if (!res.ok)
      throw new CliError(
        "FETCH_ERROR",
        `dictionary.com returned ${res.status}`,
      );
    const html = await res.text();

    const blocks = html.split("wotd-entry-wrapper");
    const results = [];

    for (let i = 1; i < blocks.length && results.length < limit; i++) {
      const b = blocks[i];
      const word =
        (b.match(/wotd-entry-headword[^>]*>([^<]+)/) || [])[1]?.trim() || "";
      if (!word) continue;

      const date =
        (b.match(/wotd-entry-date[^>]*>([^<]+)/) || [])[1]?.trim() || "";
      const pos =
        (b.match(/wotd-entry-pos[^>]*>([^<]+)/) || [])[1]?.trim() || "";
      const phonetic =
        (b.match(/wotd-entry-phonetics[^>]*>(.*?)<\/p>/s) || [])[1]
          ?.replace(/<[^>]+>/g, "")
          .trim() || "";
      const definition =
        (b.match(/wotd-entry-definition[^>]*>([^<]+)/) || [])[1]?.trim() || "";
      const example =
        (b.match(/wotd-entry-example">(.*?)<\/p>/s) || [])[1]
          ?.replace(/<[^>]+>/g, "")
          .trim() || "";

      results.push({ date, word, pos, phonetic, definition, example });
    }

    if (!results.length)
      throw new CliError("NOT_FOUND", "No word of the day found");
    return results;
  },
});

import type { Plugin, ResolvedConfig } from 'vite';
import { cwd, platform } from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';

let config: ResolvedConfig;

const retouche: (options?: {
  root?: string;
  plugins?: Array<
    (options: {
      root: string;
    }) => (
      config: ResolvedConfig,
      path: string,
      checksum: number,
      source: string
    ) => Promise<string>
  >;
}) => Plugin = (options = { root: cwd(), plugins: [] }) => {
  if (!options.plugins) options.plugins = [];
  if (!options.root) options.root = cwd();

  return {
    name: 'vite-plugin-retouche',
    enforce: 'pre',
    configResolved(resolved) {
      config = resolved;
    },
    async transform(src, id) {
      if (
        /\.c|(s[ac])ss\??.*$/.test(id) ||
        /\.json\??.*$/.test(id) ||
        !(await doesFileExist(id))
      )
        return;

      let path = id.slice(options.root.length);
      if (platform == 'win32') {
        path.replace(/\\/, '/');
      }
      let checksum = adler32(src);

      let text = textMatches(path, checksum, src);
      let link = linkMatches(path, checksum, text);
      let media = await mediaMatches(path, link);

      for (let plugin of options.plugins) {
        media = await plugin({ root: options.root })(
          config,
          path,
          checksum,
          src
        );
      }

      return {
        code: media,
        map: null,
      };
    },
  };

  function linkMatches(
    id: string,
    checksum: number,
    src: string,
    offset: number = 0
  ): string {
    const matches = Array.from(
      src.matchAll(
        /(<\s*(?!\/\s*)(\S*?)\s(?:[\s\S](?!>|<|\/))*?data-retouche-link(?=[\s\/>])((?=[\s>]?)[\S\s]*?\/?\s*>))/gm
      )
    );

    for (let element of matches) {
      let links = Array.from(
        element[0].matchAll(/href=(['"])(.*?)(?<!\\)\1/gm)
      );
      if (links.length == 1) {
        let index =
          offset + element.index + element[0].length - element[3].length;
        let a = src.slice(0, index);
        let b = src.slice(index);

        let link = links[0];

        let ident =
          '="' +
          encodeURIComponent(id) +
          ':' +
          checksum +
          ':' +
          (element.index + link.index + "href='".length) +
          ':' +
          (element.index + link.index + link[0].length - 1) +
          '"';

        src = a + ident + b;
        offset += ident.length;
      }
    }

    return src;
  }

  async function mediaMatches(
    id: string,
    src: string,
    offset: number = 0
  ): Promise<string> {
    const matches = Array.from(
      src.matchAll(
        /(<\s*(?!\/\s*)(\S*?)\s(?:[\s\S](?!>|<|\/))*?data-retouche-file(?=[\s\/>])((?=[\s>]?)[\S\s]*?\/?\s*>))/gm
      )
    );

    for (let element of matches) {
      let source = element[0].match(/src=(['"])(.*?)(?<!\\)\1/);
      if (!source) continue;
      let location = source[2].match(/(?:\${(.*?)})|.+/)![1] || source[2];
      if (!location) continue;

      if (!location.startsWith('/') && !location.startsWith('.')) {
        let r = new RegExp(
          'import\\s[\\s\\S]*?' +
            location.replace(/([^a-zA-Z0-9_])/g, '\\$1') +
            '[\\s\\S]*?\\sfrom\\s*(.)(.*?)\\1',
          'gm'
        );

        let actualLocation = r.exec(src);
        if (!actualLocation) continue;
        location = actualLocation[2].split('?')[0];
      }

      for (let alias of config.resolve.alias) {
        if (typeof alias.find == 'string' && location.startsWith(alias.find)) {
          location = path.join(
            alias.replacement,
            location.slice(alias.find.length)
          );
        } else if (alias instanceof RegExp) {
          location = location.replace(alias, alias.replacement);
        }
      }

      if (!location.startsWith(options.root) && location.startsWith('/')) {
        location = path.join(config.publicDir, location.slice(1));
      } else if (location.startsWith('.')) {
        location = path.resolve(
          options.root,
          path.dirname(id).slice(1),
          location
        );
      }

      if (await doesFileExist(location)) {
        let index =
          offset + element.index + element[0].length - element[3].length;
        let a = src.slice(0, index);
        let b = src.slice(index);
        let ident =
          '="' + encodeURIComponent(location.slice(options.root.length)) + '"';
        src = a + ident + b;
        offset += ident.length;
      }
    }

    return src;
  }

  function textMatches(
    id: string,
    checksum: number,
    src: string,
    offset: number = 0,
    nested: string | null = null,
    nestedOffset: number = 0
  ): string {
    const matches = Array.from(
      (nested ?? src)
        .toLowerCase()
        .matchAll(
          /(<\s*(?!\/\s*)(\S*?)\s(?:[\s\S](?!>|<|\/))*?data-retouche(?=[\s\/>])((?=[\s>]?)[\S\s]*?\/?\s*>))((?<!\/\s*>)(([\S\s]*?)(<\s*\/\s*\2\s*>)))?/gm
        )
    );

    for (let match of matches) {
      const fullMatch = match[0];
      const fullTagWithWhitespace = match[1];
      const afterAttributeUntilOpeningTagEnd = match[3] || '';
      const closingTagWithWhitespace = match[7];

      let actualContentOriginal = src.slice(
        match.index + offset + fullTagWithWhitespace.length,
        match.index +
          offset +
          fullMatch.length -
          (closingTagWithWhitespace?.length || 0)
      );

      let a = src.slice(
        0,
        match.index +
          offset +
          (fullTagWithWhitespace.length -
            afterAttributeUntilOpeningTagEnd.length)
      );

      let b = src.slice(match.index + offset + fullMatch.length);

      const ident =
        '="' +
        encodeURIComponent(id) +
        ':' +
        checksum +
        ':' +
        (nestedOffset + match.index + fullTagWithWhitespace.length) +
        ':' +
        (nestedOffset +
          match.index +
          fullTagWithWhitespace.length +
          actualContentOriginal.length) +
        '"';

      src =
        a +
        ident +
        afterAttributeUntilOpeningTagEnd +
        actualContentOriginal +
        (closingTagWithWhitespace || '') +
        b;
      offset += ident.length;

      if (closingTagWithWhitespace) {
        let nestedSrc = textMatches(
          id,
          checksum,
          src,
          match.index + offset + fullTagWithWhitespace.length,
          actualContentOriginal,
          nestedOffset + match.index + fullTagWithWhitespace.length
        );
        offset += nestedSrc.length - src.length;
        src = nestedSrc;
      }
    }

    return src;
  }
};

function adler32(value: string) {
  let a = 1;
  let b = 0;

  for (let i = 0; i < value.length; i += 1) {
    a += value.charCodeAt(i);
    b = b + a;
  }

  return (b << 16) + a;
}

async function doesFileExist(path: string) {
  let resolver;
  let promise = new Promise((resolve) => (resolver = resolve));
  try {
    fs.access(path, fs.constants.R_OK, (err) => {
      if (!err) {
        resolver(true);
      }
      resolver(false);
    });
  } catch (err) {
    resolver(false);
  }

  return promise;
}

export default retouche;

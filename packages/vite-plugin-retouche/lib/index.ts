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
      source: string,
      original: string
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

      let original = src.slice(0);
      let code = extractor(path, checksum, src, original.slice(0));
      code = await mediaMatches(path, code);

      for (let plugin of options.plugins) {
        code = await plugin({ root: options.root })(
          config,
          path,
          checksum,
          src,
          original.slice(0)
        );
      }

      return {
        code,
        map: null,
      };
    },
  };

  function extractor(
    id: string,
    checksum: number,
    src: string,
    original: string,
    offset: number = 0,
    pseudoOffset: number = 0
  ): string {
    const matches = Array.from(
      src.matchAll(
        /(<\s*(?!\/\s*)(\S*?)\s(?:[\s\S](?!>|<|\/))*?(data-retouche(?:(?:-link))?)(?=[\s\/>])((?=[\s>]?)[\S\s]*?\/?\s*>))((?<!\/\s*>)(([\S\s]*?)(<\s*\/\s*\2\s*>)))?/gim
      )
    );

    for (let match of matches) {
      let code = '';

      if (match[3].toLowerCase() == 'data-retouche-link') {
        code = linkMatch(
          id,
          checksum,
          match[0],
          original,
          pseudoOffset + match.index
        );
      } else {
        code = textMatch(
          id,
          checksum,
          match[0],
          original,
          pseudoOffset + match.index
        );
      }

      let a = src.slice(0, offset + match.index);
      let b = src.slice(offset + match.index + match[0].length);

      offset += code.length - match[0].length;
      src = a + code + b;
    }

    return src;
  }

  function linkMatch(
    id: string,
    checksum: number,
    src: string,
    original: string,
    offset: number
  ): string {
    const matches = Array.from(
      src.matchAll(
        /(<\s*(?!\/\s*)(\S*?)\s(?:[\s\S](?!>|<|\/))*?data-retouche-link(?=[\s\/>])((?=[\s>]?)[\S\s]*?\/?\s*>))((?<!\/\s*>)(([\S\s]*?)(<\s*\/\s*\2\s*>)))?/gim
      )
    );
    let match = matches[0];

    let links = Array.from(match[0].matchAll(/href=(['"])(.*?)(?<!\\)\1/gm));
    let link = links[0];

    let ident =
      '="' +
      encodeURIComponent(id) +
      ':' +
      checksum +
      ':' +
      (offset + match.index + link.index + "href='".length) +
      ':' +
      (offset + match.index + link.index + link[0].length - 1) +
      '"';

    // console.log(
    //   'editable link',
    //   original.slice(
    //     offset + match.index + link.index + "href='".length,
    //     offset + match.index + link.index + link[0].length - 1
    //   )
    // );

    let a;
    let b;

    let openOpeningTagEndIndex =
      match.index + match[1].length - match[3].length; // e.g. `<p data-retouche*HERE*`

    if (match[6]) {
      a = match[1].slice(0, openOpeningTagEndIndex);
      b =
        match[3] +
        extractor(
          id,
          checksum,
          match[6],
          original,
          0,
          offset + match.index + match[1].length
        ) +
        match[7];
    } else {
      a = src.slice(0, openOpeningTagEndIndex);
      b = src.slice(openOpeningTagEndIndex);
    }

    return a + ident + b;
  }

  function textMatch(
    id: string,
    checksum: number,
    src: string,
    original: string,
    offset: number
  ): string {
    const matches = Array.from(
      src.matchAll(
        /(<\s*(?!\/\s*)(\S*?)\s(?:[\s\S](?!>|<|\/))*?data-retouche(?=[\s\/>])((?=[\s>]?)[\S\s]*?\/?\s*>))((?<!\/\s*>)(([\S\s]*?)(<\s*\/\s*\2\s*>)))?/gim
      )
    );
    let match = matches[0];

    if (/\/\s*>$/.test(match[3])) {
      return src;
    }

    const ident =
      '="' +
      encodeURIComponent(id) +
      ':' +
      checksum +
      ':' +
      (offset + match.index + match[1].length) +
      ':' +
      (offset + match.index + match[0].length - match[7].length) +
      '"';

    // console.log(
    //   'editable text',
    //   original.slice(
    //     offset + match.index + match[1].length,
    //     offset + match.index + match[0].length - match[7].length
    //   )
    // );

    let a;
    let b;

    let openOpeningTagEndIndex =
      match.index + match[1].length - match[3].length; // e.g. `<p data-retouche*HERE*`

    if (match[6]) {
      a = src.slice(0, openOpeningTagEndIndex);
      b =
        match[3] +
        extractor(
          id,
          checksum,
          match[6],
          original,
          0,
          offset + match.index + match[1].length
        ) +
        match[7];
    } else {
      a = src.slice(0, openOpeningTagEndIndex);
      b = src.slice(openOpeningTagEndIndex);
    }

    return a + ident + b;
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
};

function adler32(value: string): number {
  let a = 1;
  let b = 0;

  for (let i = 0; i < value.length; i += 1) {
    a += value.charCodeAt(i);
    b = b + a;
  }

  return Math.abs((b << 16) + a);
}

async function doesFileExist(path: string): Promise<boolean> {
  let resolver;
  let promise: Promise<boolean> = new Promise(
    (resolve) => (resolver = resolve)
  );

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

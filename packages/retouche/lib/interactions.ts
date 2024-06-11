import Link from '$lib/components/Link.svelte';
import Arbitrary from '$lib/components/File.svelte';
import Text from '$lib/components/Text.svelte';
import Edit from '$lib/components/Edit.svelte';

import { Interactions } from '$lib/index';

import { replacements, targeted } from '$lib/components/store';

let token: string | null = null;

let username: string | null = null;
let password: string | null = null;

export const interactions: Interactions = {
  async published() {
    alert('Published!');
  },
  async renderEditableLink(element) {
    new Link({
      target: document.body,
      props: { element },
    });
  },
  async renderEditableFile(element) {
    new Arbitrary({
      target: document.body,
      props: { element },
    });
  },
  async renderEditableText(element) {
    new Text({
      target: document.body,
      props: { element },
    });
  },
  async renderInit(edit, publish) {
    new Edit({
      target: document.body,
      props: {
        edit,
        publish,
      },
    });
  },
  unauthorised(path) {
    if (!path) {
      alert('Unauthorised');
      throw new Error('Unauthorised');
    } else {
      alert('Not authorised to access "' + path + '"');
      throw new Error('Not authorised to access "' + path + '"');
    }
  },
  unknownFile(path) {
    alert('Unable to locate "' + path + '"');
    throw new Error('Unable to locate "' + path + '"');
  },
  unmatchedChecksum(path) {
    alert('Found unmatched version for "' + path + '"');
    throw new Error('Found unmatched version for "' + path + '"');
  },
  async getReplacements() {
    return replacements;
  },
  async getTargetedReplacements() {
    return targeted;
  },
  requestCredentials(mode) {
    if (mode === 'basic') {
      if (username && password) return { username, password };

      let _username = prompt('Please provide your username');
      if (_username == null) {
        this.unauthorised(undefined);
        throw new Error('Unreachable');
      }

      let _password = prompt('Please provide your password');
      if (_password == null) {
        this.unauthorised(undefined);
        throw new Error('Unreachable');
      }

      username = _username;
      password = _password;

      return { username, password };
    }
    if (mode === 'bearer') {
      if (token) return token;

      let bearer = prompt('Please provide an authentication token');
      if (bearer == null) {
        this.unauthorised(undefined);
        throw new Error('Unreachable');
      }

      token = bearer;
      return bearer;
    }

    throw new TypeError('Unexpected mode');
    // https://github.com/microsoft/TypeScript/issues/24929#issuecomment-428333515
    return undefined as any;
  },
  expectedChangeDescription() {
    alert('Expected a description change');
    throw new Error('Expected a change description');
  },
  requestChangeDescription() {
    return prompt('Please describe your changes');
  },
  unknownError() {
    alert('An unknown error occurred');
    throw new Error('Expected a change description');
  },
};

import type { Adapter } from 'retouche';

export let github: (options: {
  owner: string;
  repo: string;
  commit:
    | {
        message: string;
        committer: { name: string; email: string };
      }
    | {
        message: string;
        requestChangeDescription: 'lax';
        committer: { name: string; email: string };
      }
    | {
        requestChangeDescription: 'strict';
        committer: { name: string; email: string };
      };
}) => Adapter = (options) => (interact) => {
  let shaStore: { [key: string]: string } = {};
  let fileStore: { [key: string]: string } = {};

  let commitMessage = 'message' in options.commit ? options.commit.message : '';

  return {
    hooks: {
      async beforePublish() {
        if ('message' in options.commit) {
          commitMessage = options.commit.message;
        }

        if ('requestChangeDescription' in options.commit) {
          if (options.commit.requestChangeDescription == 'lax') {
            let changeDescription = await interact.requestChangeDescription();
            if (changeDescription) {
              commitMessage = changeDescription;
            }
          } else {
            let changeDescription = await interact.requestChangeDescription();
            if (changeDescription) {
              commitMessage = changeDescription;
            } else {
              await interact.expectedChangeDescription();
            }
          }
        }
      },
    },
    actions: {
      async putFile(path, content) {
        let bearer = await interact.requestCredentials('bearer');
        console.debug('put =>', path);

        let response = await fetch(
          `https://api.github.com/repos/${options.owner}/${options.repo}/contents${path}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              message: commitMessage,
              committer: {
                name: options.commit.committer.name,
                email: options.commit.committer.email,
              },
              sha: shaStore[path],
              content,
            }),
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${bearer}`,
              'X-GitHub-Api-Version': '2022-11-28',
            },
          }
        );

        if (response.status !== 200) {
          console.error(response);
          console.error(await response.text());

          if (response.status == 403 || response.status == 401) {
            await interact.unauthorised(path);
          }

          if (response.status == 404) {
            await interact.unknownFile(path);
          }

          await interact.unknownError();
        }
      },
      async getFile(path) {
        let bearer = await interact.requestCredentials('bearer');
        console.debug('get =>', path);

        if (path in fileStore) {
          return fileStore[path];
        }

        let response = await fetch(
          `https://api.github.com/repos/${options.owner}/${options.repo}/contents${path}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/vnd.github+json',
              Authorization: `Bearer ${bearer}`,
              'X-GitHub-Api-Version': '2022-11-28',
            },
          }
        );

        if (response.status !== 200) {
          console.error(response);
          console.error(await response.text());

          if (response.status == 403 || response.status == 401) {
            await interact.unauthorised(path);
          }

          if (response.status == 404) {
            await interact.unknownFile(path);
          }

          await interact.unknownError();
        }

        let file: {
          content: string;
          sha: string;
        } = await response.json();

        shaStore[path] = file.sha;
        fileStore[path] = file.content;

        return file.content;
      },
      async getMetadata(path) {
        await this.getFile(path);
      },
    },
  };
};

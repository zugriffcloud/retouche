import type { Adapter } from 'retouche';

export let gitlab: (options: {
  project: string | number;
  ref?: string;
  branch?: string;
  commit:
    | {
        message: string;
        committer?: { name: string; email: string };
      }
    | {
        message: string;
        requestChangeDescription: 'lax';
        committer?: { name: string; email: string };
      }
    | {
        requestChangeDescription: 'strict';
        committer?: { name: string; email: string };
      };
  instance?: string;
}) => Adapter = (options) => (interact) => {
  if (options.instance) {
    options.instance = options.instance.replace(/\/$/, '');
  } else {
    options.instance = 'https://gitlab.com';
  }

  let commitMessage = 'message' in options.commit ? options.commit.message : '';

  let fileStore: { [key: string]: string } = {};
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
          `${options.instance}/api/v4/projects/${options.project}/repository/files/${encodeURIComponent(path.replace(/^\//, ''))}`,
          {
            method: 'PUT',
            body: JSON.stringify({
              branch: options.branch || 'main',
              author_email: options.commit.committer?.email,
              author_name: options.commit.committer?.name,
              content,
              encoding: 'base64',
              commit_message: commitMessage,
            }),
            headers: {
              'Content-Type': 'application/json',
              'PRIVATE-TOKEN': bearer,
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
          `${options.instance}/api/v4/projects/${options.project}/repository/files/${encodeURIComponent(path.replace(/^\//, ''))}?ref=${options.ref || 'main'}`,
          {
            method: 'GET',
            headers: {
              'PRIVATE-TOKEN': bearer,
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
        } = await response.json();

        fileStore[path] = file.content;

        return file.content;
      },
      async getMetadata(_) {
        // GitLab does not require a hash to update a file
      },
    },
  };
};

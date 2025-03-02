/// <reference types="cypress" />

import moment from 'moment';
import {formatDate, humanizeTimeForExpiry} from '../../src/libs/utils';

describe('Repository Builds', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/v1/user/', {fixture: 'user.json'}).as('getUser');
    cy.intercept('GET', '/config', {fixture: 'config.json'}).as('getConfig');
    cy.intercept('GET', '/csrf_token', {fixture: 'csrfToken.json'}).as(
      'getCsrfToken',
    );
    cy.intercept(
      'GET',
      '/api/v1/repository/testorg/testrepo?includeStats=false&includeTags=false',
      {fixture: 'testrepo.json'},
    ).as('getRepo');
    cy.intercept('GET', '/api/v1/organization/testorg', {
      fixture: 'testorg.json',
    }).as('getOrg');
  });

  it('Shows empty list', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      builds: [],
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuildTriggers');
    cy.visit('/repository/testorg/testrepo?tab=builds');
    cy.contains('Build History');
    cy.contains(
      'No matching builds found. Please start a new build or adjust filter to view build status.',
    );
  });

  it('Displays build status', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuildTriggers');
    cy.visit('/repository/testorg/testrepo?tab=builds');
    const expectedRowData = [
      {
        id: 'build001',
        status: 'error',
        trigger: {
          message: 'Triggered by commit commit1',
        },
        started: 'Tue, 28 Nov 2023 15:37:33 -0000',
        tags: ['commit1'],
      },
      {
        id: 'build002',
        status: 'internal error',
        trigger: {
          message: 'user1',
        },
        started: 'Mon, 27 Nov 2023 20:21:19 -0000',
        tags: ['latest'],
      },
      {
        id: 'build003',
        status: 'build-scheduled',
        trigger: {
          message: '(Manually Triggered Build)',
        },
        started: 'Mon, 27 Nov 2023 20:21:19 -0000',
        tags: ['latest'],
      },
      {
        id: 'build004',
        status: 'unpacking',
        trigger: {
          message:
            'Triggered by push to repository https://github.com/quay/quay',
        },
        started: 'Sun, 12 Nov 2023 16:24:50 -0000',
        tags: [],
      },
      {
        id: 'build005',
        status: 'pulling',
        trigger: {
          message:
            'Triggered by push to GitHub repository https://github.com/quay/quay',
        },
        started: 'Sun, 12 Nov 2023 16:24:50 -0000',
        tags: [],
      },
      {
        id: 'build006',
        status: 'building',
        trigger: {
          message:
            'Triggered by push to BitBucket repository https://github.com/quay/quay',
        },
        started: 'Sun, 12 Nov 2023 16:24:50 -0000',
        tags: [],
      },
      {
        id: 'build007',
        status: 'pushing',
        trigger: {
          message:
            'Triggered by push to GitLab repository https://github.com/quay/quay',
        },
        started: 'Sun, 12 Nov 2023 16:24:50 -0000',
        tags: [],
      },
      {
        id: 'build008',
        status: 'waiting',
        trigger: {
          message: 'custom-git build from branch',
          messageLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          authoredDate: '2023-11-28T10:42:17-05:00',
          author: 'user1',
          commit: 'commit2',
          commitLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          ref: 'master',
          refLink: '',
        },
        started: 'Thu, 28 Sep 2023 16:52:29 -0000',
        tags: ['latest', 'master'],
      },
      {
        id: 'build009',
        status: 'complete',
        trigger: {
          message: 'github build from branch',
          messageLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          authoredDate: '2023-11-28T10:42:17-05:00',
          author: 'user1',
          commit: 'commit2',
          commitLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          ref: 'master',
          refLink: 'https://github.com/quay/quay/tree/master',
        },
        started: 'Thu, 28 Sep 2023 16:52:29 -0000',
        tags: ['latest', 'master'],
      },
      {
        id: 'build010',
        status: 'cancelled',
        trigger: {
          message: 'gitlab build from branch',
          messageLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          authoredDate: '2023-11-28T10:42:17-05:00',
          author: 'user1',
          commit: 'commit2',
          commitLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          ref: 'master',
          refLink: 'https://github.com/quay/quay/tree/master',
        },
        started: 'Thu, 28 Sep 2023 16:52:29 -0000',
        tags: ['latest', 'master'],
      },
      {
        id: 'build011',
        status: 'expired',
        trigger: {
          message: 'bitbucket build from branch',
          messageLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          authoredDate: '2023-11-28T10:42:17-05:00',
          author: 'user1',
          commit: 'commit2',
          commitLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          ref: 'master',
          refLink: 'https://github.com/quay/quay/branch/master',
        },
        started: 'Thu, 28 Sep 2023 16:52:29 -0000',
        tags: ['latest', 'master'],
      },
      {
        id: 'build012',
        status: 'waiting',
        trigger: {
          message: 'custom git build from tag',
          messageLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          authoredDate: '2023-11-28T10:42:17-05:00',
          author: 'user1',
          commit: 'commit2',
          commitLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          ref: 'newtag',
        },
        started: 'Thu, 28 Sep 2023 16:52:29 -0000',
        tags: ['latest', 'master'],
      },
      {
        id: 'build013',
        status: 'waiting',
        trigger: {
          message: 'github build from tag',
          messageLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          authoredDate: '2023-11-28T10:42:17-05:00',
          author: 'user1',
          commit: 'commit2',
          commitLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          ref: 'newtag',
          refLink: 'https://github.com/quay/quay/releases/tag/newtag',
        },
        started: 'Thu, 28 Sep 2023 16:52:29 -0000',
        tags: ['latest', 'master'],
      },
      {
        id: 'build014',
        status: 'waiting',
        trigger: {
          message: 'gitlab build from tag',
          messageLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          authoredDate: '2023-11-28T10:42:17-05:00',
          author: 'user1',
          commit: 'commit2',
          commitLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          ref: 'newtag',
          refLink: 'https://github.com/quay/quay/commits/newtag',
        },
        started: 'Thu, 28 Sep 2023 16:52:29 -0000',
        tags: ['latest', 'master'],
      },
      {
        id: 'build015',
        status: 'waiting',
        trigger: {
          message: 'bitbucket build from tag',
          messageLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          authoredDate: '2023-11-28T10:42:17-05:00',
          author: 'user1',
          commit: 'commit2',
          commitLink:
            'https://github.com/quay/quay/commit/commit2b46cf9a7510fd9ef3bcc7191834c5abda',
          ref: 'newtag',
          refLink: 'https://github.com/quay/quay/commits/tag/newtag',
        },
        started: 'Thu, 28 Sep 2023 16:52:29 -0000',
        tags: ['latest', 'master'],
      },
    ];
    for (const expectedData of expectedRowData) {
      cy.contains('tr', expectedData.id).within(() => {
        cy.get('td[data-label="Status"]').contains(expectedData.status);
        cy.get('td[data-label="Triggered by"]').within(() => {
          const messageElement = cy.contains(expectedData.trigger.message);
          if (expectedData.trigger.messageLink) {
            messageElement.should(
              'have.attr',
              'href',
              expectedData.trigger.messageLink,
            );
          }
          if (expectedData.trigger.authoredDate) {
            // Time difference between now and author date in seconds
            const authorDate =
              (new Date().getTime() -
                new Date(expectedData.trigger.authoredDate).getTime()) /
              1000;
            cy.contains(humanizeTimeForExpiry(authorDate));
          }
          if (expectedData.trigger.author) {
            cy.contains(expectedData.trigger.author);
          }
          if (expectedData.trigger.commit) {
            const commitElement = cy.contains(expectedData.trigger.commit);
            if (expectedData.trigger.commitLink) {
              commitElement.should(
                'have.attr',
                'href',
                expectedData.trigger.commitLink,
              );
            }
          }
          if (expectedData.trigger.ref) {
            const refElement = cy.contains(expectedData.trigger.ref);
            if (expectedData.trigger.refLink) {
              refElement.should(
                'have.attr',
                'href',
                expectedData.trigger.refLink,
              );
            }
          }
        });
        cy.get('td[data-label="Date started"]').contains(
          formatDate(expectedData.started),
        );
        for (const tag of expectedData.tags) {
          cy.get('td[data-label="Tags"]').contains(tag);
        }
      });
    }
  });

  it('Expands long commit messages', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuildTriggers');
    cy.visit('/repository/testorg/testrepo?tab=builds');
    cy.contains('tr', 'random text to test long description').within(() => {
      cy.contains('success viewing long description').should('not.exist');
      cy.get('[data-testid="expand-long-description"]').click();
      cy.contains('success viewing long description');
    });
  });

  it('Filters by 48 hours', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuildTriggers');
    cy.intercept(
      'GET',
      '/api/v1/repository/testorg/testrepo/build/?limit=100&since=*',
      {fixture: 'builds.json'},
    ).as('getBuilds48Hours');
    cy.visit('/repository/testorg/testrepo?tab=builds');
    cy.contains('Last 48 hours').click();
    cy.wait('@getBuilds48Hours').then(({request}) => {
      const start = moment((request.query.since as number) * 1000);
      const end = moment(new Date());
      const days = Math.round(moment.duration(end.diff(start)).asDays());
      expect(days).equal(2);
    });
  });

  it('Filters by 30 days', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuildTriggers');
    cy.intercept(
      'GET',
      '/api/v1/repository/testorg/testrepo/build/?limit=100&since=*',
      {fixture: 'builds.json'},
    ).as('getBuilds30Days');
    cy.visit('/repository/testorg/testrepo?tab=builds');
    cy.contains('Last 30 days').click();
    cy.wait('@getBuilds30Days').then(({request}) => {
      const start = moment((request.query.since as number) * 1000);
      const end = moment(new Date());
      const days = Math.round(moment.duration(end.diff(start)).asDays());
      expect(days).equal(30);
    });
  });

  it('displays build triggers', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuildTriggers');
    cy.visit('/repository/testorg/testrepo?tab=builds');
    const expectedRowData = [
      {
        name: 'push to GitHub repository testgitorg/testgitrepo',
        dockerfilePath: '/Dockerfile',
        context: '/',
        branchtagRegex: '^newbranch$',
        robot: '(None)',
        taggingOptions: [
          'Branch/tag name',
          'latest if default branch',
          '${commit_info.short_sha}',
        ],
      },
      {
        name: 'push to repository https://github.com/testgitorg/testgitrepo',
        dockerfilePath: '/Dockerfile',
        context: '/web',
        branchtagRegex: 'All',
        robot: '(None)',
        taggingOptions: ['Branch/tag name', '${commit_info.short_sha}'],
      },
      {
        name: 'push to GitLab repository testgitorg/testgitrepo',
        dockerfilePath: '/application/Dockerfile',
        context: '/',
        branchtagRegex: 'All',
        robot: '(None)',
        taggingOptions: [],
      },
    ];
    for (const expectedData of expectedRowData) {
      cy.contains('tr', expectedData.name).within(() => {
        cy.get('td[data-label="trigger name"]').contains(expectedData.name);
        cy.get('td[data-label="dockerfile path"]').contains(
          expectedData.dockerfilePath,
        );
        cy.get('td[data-label="context"]').contains(expectedData.context);
        cy.get('td[data-label="branchtag regex"]').contains(
          expectedData.branchtagRegex,
        );
        cy.get('td[data-label="pull robot"]').contains(expectedData.robot);
        for (const option of expectedData.taggingOptions) {
          cy.get('td[data-label="tagging options"]').contains(option);
        }
      });
    }
  });

  it('Disables trigger', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuildTriggers');
    cy.intercept(
      'PUT',
      '/api/v1/repository/testorg/testrepo/trigger/githubfe-70b5-4bf9-8eb9-8dccf9874aed',
      {
        statusCode: 200,
      },
    ).as('disableTrigger');

    cy.visit('/repository/testorg/testrepo?tab=builds');
    cy.contains(
      'tr',
      'push to GitHub repository testgitorg/testgitrepo',
    ).within(() => {
      cy.get('button[data-testid="build-trigger-actions-kebab"]').click();
      cy.contains('Disable Trigger').click();
    });
    cy.contains('Disable Build Trigger');
    cy.contains('Are you sure you want to disable this build trigger?');
    cy.contains('button', 'Disable Build Trigger').click();
    cy.get('@disableTrigger')
      .its('request.body')
      .should('deep.equal', {enabled: false});
    cy.contains('Successfully disabled trigger');
  });

  it('Enables trigger', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuildTriggers');
    cy.intercept(
      'PUT',
      '/api/v1/repository/testorg/testrepo/trigger/gitlab82-9fd5-4005-bc95-d3156855f0d5',
      {
        statusCode: 200,
      },
    ).as('enableTrigger');

    cy.visit('/repository/testorg/testrepo?tab=builds');
    cy.contains(
      'tr',
      'push to GitLab repository testgitorg/testgitrepo',
    ).within(() => {
      cy.get('button[data-testid="build-trigger-actions-kebab"]').click();
      cy.contains('Enable Trigger').click();
    });
    cy.contains('Enable Build Trigger');
    cy.contains('Are you sure you want to enable this build trigger?');
    cy.contains('button', 'Enable Build Trigger').click();
    cy.get('@enableTrigger')
      .its('request.body')
      .should('deep.equal', {enabled: true});
    cy.contains('Successfully enabled trigger');
  });

  it('Views trigger credentials', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuildTriggers');
    cy.visit('/repository/testorg/testrepo?tab=builds');

    // Viewing github credentials
    cy.contains(
      'tr',
      'push to GitHub repository testgitorg/testgitrepo',
    ).within(() => {
      cy.get('button[data-testid="build-trigger-actions-kebab"]').click();
      cy.contains('View Credentials').click();
    });
    cy.contains('Trigger Credentials');
    cy.contains(
      'The following key has been automatically added to your source control repository.',
    );
    cy.get('[data-testid="SSH Public Key"').within(() => {
      cy.get('input').should('have.value', 'fakekey');
    });
    cy.contains('Done').click();

    // Viewing git credentials
    cy.contains(
      'tr',
      'push to repository https://github.com/testgitorg/testgitrepo',
    ).within(() => {
      cy.get('button[data-testid="build-trigger-actions-kebab"]').click();
      cy.contains('View Credentials').click();
    });
    cy.contains('Trigger Credentials');
    cy.contains(
      'In order to use this trigger, the following first requires action:',
    );
    cy.contains(
      'You must give the following public key read access to the git repository.',
    );
    cy.contains(
      'You must set your repository to POST to the following URL to trigger a build.',
    );
    cy.contains(
      'For more information, refer to the Custom Git Triggers documentation.',
    );
    cy.get('[data-testid="SSH Public Key"').within(() => {
      cy.get('input').should('have.value', 'fakekey');
    });
    cy.get('[data-testid="Webhook Endpoint URL"').within(() => {
      cy.get('input').should(
        'have.value',
        'https://$token:faketoken@localhost:8080/webhooks/push/trigger/67595ac0-5014-4962-81a0-9a8d336ca851',
      );
    });
    cy.contains('Done').click();

    // Viewing gitlab credentials
    cy.contains(
      'tr',
      'push to GitLab repository testgitorg/testgitrepo',
    ).within(() => {
      cy.get('button[data-testid="build-trigger-actions-kebab"]').click();
      cy.contains('View Credentials').click();
    });
    cy.contains('Trigger Credentials');
    cy.contains(
      'The following key has been automatically added to your source control repository.',
    );
    cy.get('[data-testid="SSH Public Key"').within(() => {
      cy.get('input').should('have.value', 'fakekey');
    });
  });

  it('Delete trigger', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuildTriggers');
    cy.intercept(
      'DELETE',
      '/api/v1/repository/testorg/testrepo/trigger/githubfe-70b5-4bf9-8eb9-8dccf9874aed',
      {
        statusCode: 200,
      },
    ).as('deleteTrigger');
    cy.visit('/repository/testorg/testrepo?tab=builds');

    cy.contains(
      'tr',
      'push to GitHub repository testgitorg/testgitrepo',
    ).within(() => {
      cy.get('button[data-testid="build-trigger-actions-kebab"]').click();
      cy.contains('Delete Trigger').click();
    });
    cy.contains('Delete Build Trigger');
    cy.contains(
      'Are you sure you want to delete this build trigger? No further builds will be automatically started.',
    );
    cy.contains('button', 'Delete Trigger').click();
    cy.wait('@deleteTrigger');
    cy.contains('Successfully deleted trigger');
  });

  it('Re-enable disabled trigger', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.fixture('build-triggers.json').then((triggersFixture) => {
      const githubTrigger = triggersFixture.triggers.filter(
        (trigger) => trigger.id === 'githubfe-70b5-4bf9-8eb9-8dccf9874aed',
      )[0];
      const gitTrigger = triggersFixture.triggers.filter(
        (trigger) => trigger.id === 'custom-git35014-4962-81a0-9a8d336ca851',
      )[0];
      const gitlabTrigger = triggersFixture.triggers.filter(
        (trigger) => trigger.id === 'gitlab82-9fd5-4005-bc95-d3156855f0d5',
      )[0];
      githubTrigger.enabled = false;
      githubTrigger.disabled_reason = 'user_toggled';
      gitTrigger.enabled = false;
      gitTrigger.disabled_reason = 'successive_build_failures';
      gitlabTrigger.enabled = false;
      gitlabTrigger.disabled_reason = 'successive_build_internal_errors';
      cy.intercept(
        'GET',
        '/api/v1/repository/testorg/testrepo/trigger/',
        triggersFixture,
      ).as('getBuildTriggers');
    });
    cy.intercept(
      'PUT',
      '/api/v1/repository/testorg/testrepo/trigger/githubfe-70b5-4bf9-8eb9-8dccf9874aed',
      {
        statusCode: 200,
      },
    ).as('enableGithubTrigger');
    cy.intercept(
      'PUT',
      '/api/v1/repository/testorg/testrepo/trigger/custom-git35014-4962-81a0-9a8d336ca851',
      {
        statusCode: 200,
      },
    ).as('enableGitTrigger');
    cy.intercept(
      'PUT',
      '/api/v1/repository/testorg/testrepo/trigger/gitlab82-9fd5-4005-bc95-d3156855f0d5',
      {
        statusCode: 200,
      },
    ).as('enableGitlabTrigger');
    cy.visit('/repository/testorg/testrepo?tab=builds');
    cy.contains(
      'tbody',
      'push to GitHub repository testgitorg/testgitrepo',
    ).within(() => {
      cy.contains('This build trigger is user disabled and will not build.');
      cy.contains('Re-enable this trigger').click();
    });
    cy.contains('Are you sure you want to enable this build trigger?');
    cy.contains('button', 'Enable Build Trigger').click();
    cy.wait('@enableGithubTrigger')
      .its('request.body')
      .should('deep.equal', {enabled: true});
    cy.contains(
      'tbody',
      'push to repository https://github.com/testgitorg/testgitrepo',
    ).within(() => {
      cy.contains(
        'This build trigger was automatically disabled due to successive failures.',
      );
      cy.contains('Re-enable this trigger').click();
    });
    cy.contains('Are you sure you want to enable this build trigger?');
    cy.contains('button', 'Enable Build Trigger').click();
    cy.wait('@enableGitTrigger')
      .its('request.body')
      .should('deep.equal', {enabled: true});
    cy.contains(
      'tbody',
      'push to GitLab repository testgitorg/testgitrepo',
    ).within(() => {
      cy.contains(
        'This build trigger was automatically disabled due to successive internal errors.',
      );
      cy.contains('Re-enable this trigger').click();
    });
    cy.contains('Are you sure you want to enable this build trigger?');
    cy.contains('button', 'Enable Build Trigger').click();
    cy.wait('@enableGitlabTrigger')
      .its('request.body')
      .should('deep.equal', {enabled: true});
  });

  it('Provides option to delete incomplete trigger', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.fixture('build-triggers.json').then((triggersFixture) => {
      const githubTrigger = triggersFixture.triggers.filter(
        (trigger) => trigger.id === 'githubfe-70b5-4bf9-8eb9-8dccf9874aed',
      )[0];
      githubTrigger.is_active = false;
      cy.intercept(
        'GET',
        '/api/v1/repository/testorg/testrepo/trigger/',
        triggersFixture,
      ).as('getBuildTriggers');
    });
    cy.intercept(
      'DELETE',
      '/api/v1/repository/testorg/testrepo/trigger/githubfe-70b5-4bf9-8eb9-8dccf9874aed',
      {
        statusCode: 200,
      },
    ).as('deleteTrigger');
    cy.visit('/repository/testorg/testrepo?tab=builds');
    cy.contains('This build trigger has not had its setup completed.');
    cy.contains('Delete Trigger').click();
    cy.wait('@deleteTrigger');
  });
});

describe('Repository Builds - Create Build Triggers', () => {
  beforeEach(() => {
    cy.exec('npm run quay:seed');
    cy.request('GET', `${Cypress.env('REACT_QUAY_APP_API_URL')}/csrf_token`)
      .then((response) => response.body.csrf_token)
      .then((token) => {
        cy.loginByCSRF(token);
      });
  });

  it('Creates build trigger', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuilds');
    cy.visit('/repository/testorg/testrepo?tab=builds');
    cy.contains('Create Build Trigger').click();
    cy.origin(Cypress.env('REACT_QUAY_APP_API_URL'), () =>
      cy.on('uncaught:exception', (e) => false),
    );
    cy.contains('Custom Git Repository Push').click();
    cy.url().should('contain', 'repository/testorg/testrepo/trigger/');
    cy.url().should(
      'include',
      `${Cypress.env(
        'REACT_QUAY_APP_API_URL',
      )}/repository/testorg/testrepo/trigger/`,
    );
    cy.url().then((url) => {
      const redirect = url.replace(
        Cypress.env('REACT_QUAY_APP_API_URL'),
        Cypress.config().baseUrl as string,
      );
      cy.visit(redirect);
    });
    cy.contains('Setup Build Trigger:');

    // Repo URL step
    cy.contains('button', 'Next').should('be.disabled');
    cy.get('#repo-url').type('notavalidurl');
    cy.contains('Must be a valid URL');
    cy.get('#repo-url').clear();
    cy.get('#repo-url').type('https://github.com/quay/quay');
    cy.contains('Next').click();

    // Tagging Options step
    cy.contains('button', 'Next').should('be.disabled');
    cy.get('#tag-with-latest-checkbox').click();
    cy.contains('button', 'Next').should('be.disabled');
    cy.get('#tag-manifest-with-branch-or-tag-name-checkbox').click();
    cy.contains('button', 'Next').should('be.enabled');
    cy.contains('No tag templates defined.');
    cy.get('#tag-template').type('template1');
    cy.contains('Add template').click();
    cy.contains('No tag templates defined.').should('not.exist');
    cy.contains('template1');
    cy.get('#template1').within(() => cy.get('a').click());
    cy.contains('No tag templates defined.');
    cy.get('#tag-template').type('template2');
    cy.contains('Add template').click();
    cy.contains('Next').click();

    // Dockerfile path step
    cy.contains('button', 'Next').should('be.disabled');
    cy.get('#dockerfile-path').type('notavalidpath');
    cy.contains(
      'Path entered for folder containing Dockerfile is invalid: Must start with a "/".',
    );
    cy.contains('button', 'Next').should('be.disabled');
    cy.get('#dockerfile-path').clear();
    cy.get('#dockerfile-path').type('/Dockerfile/');
    cy.contains('Dockerfile path must end with a file, e.g. "Dockerfile"');
    cy.contains('button', 'Next').should('be.disabled');
    cy.get('#dockerfile-path').clear();
    cy.get('#dockerfile-path').type('/Dockerfile');
    cy.contains('Next').click();

    // Context path step
    cy.contains('button', 'Next').should('be.disabled');
    cy.get('#context-path').type('notavalidpath');
    cy.contains('Path is an invalid context.');
    cy.contains('button', 'Next').should('be.disabled');
    cy.get('#context-path').clear();
    cy.get('#context-path').type('/context');
    cy.contains('Next').click();

    // Robot account step
    cy.contains('tr', 'testorg+testrobot').within(() => {
      cy.contains('Read access will be added if selected');
      cy.get('input').click();
    });
    cy.contains('tr', 'testorg+testrobot2').within(() => {
      cy.contains('Read access will be added if selected');
    });
    cy.contains('Next').click();

    // Review and submit step
    cy.get('#repo-url').contains('https://github.com/quay/quay');
    cy.get('#tag-templates').contains('template2');
    cy.get('#tag-with-branch-or-tag').contains('enabled');
    cy.get('#tag-with-latest').contains('enabled');
    cy.get('#dockerfile-path').contains('/Dockerfile');
    cy.get('#robot-account').contains('testorg+testrobot');
    cy.get('button[type="submit"]').click();

    // Confirmation
    cy.contains('Trigger has been successfully activated');
    cy.contains(
      'Please note: If the trigger continuously fails to build, it will be automatically disabled. It can be re-enabled from the build trigger list.',
    );
    cy.contains(
      'In order to use this trigger, the following first requires action:',
    );
    cy.contains('SSH Public Key:');
    cy.contains('Webhook Endpoint URL:');
    cy.contains('Close').click();
  });

  it('displays error when analyzing trigger', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuilds');
    cy.intercept(
      'POST',
      '/api/v1/repository/testorg/testrepo/trigger/*/analyze',
      {
        statusCode: 500,
      },
    ).as('analyzeTrigger');
    cy.visit('/repository/testorg/testrepo?tab=builds');

    cy.origin(Cypress.env('REACT_QUAY_APP_API_URL'), () =>
      cy.on('uncaught:exception', (e) => false),
    );
    cy.contains('Create Build Trigger').click();
    cy.contains('Custom Git Repository Push').click();
    cy.url().should('contain', 'repository/testorg/testrepo/trigger/');
    cy.url().then((url) => {
      const redirect = url.replace(
        Cypress.env('REACT_QUAY_APP_API_URL'),
        Cypress.config().baseUrl as string,
      );
      cy.visit(redirect);
    });
    cy.contains('Setup Build Trigger:');

    cy.get('#repo-url').type('https://github.com/quay/quay');
    cy.contains('Next').click();
    cy.get('#tag-manifest-with-branch-or-tag-name-checkbox').click();
    cy.contains('Next').click();
    cy.get('#dockerfile-path').type('/Dockerfile');
    cy.contains('Next').click();
    cy.get('#context-path').type('/context');
    cy.contains('Next').click();
    cy.contains('Request failed with status code 500');
  });

  it('displays error when fetching robots', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuilds');
    cy.intercept(
      'GET',
      'api/v1/organization/testorg/robots?permissions=true&token=false',
      {
        statusCode: 500,
      },
    ).as('getRobots');
    cy.visit('/repository/testorg/testrepo?tab=builds');

    cy.contains('Create Build Trigger').click();
    cy.origin(Cypress.env('REACT_QUAY_APP_API_URL'), () =>
      cy.on('uncaught:exception', (e) => false),
    );
    cy.contains('Custom Git Repository Push').click();
    cy.url().should('contain', 'repository/testorg/testrepo/trigger/');
    cy.url().then((url) => {
      const redirect = url.replace(
        Cypress.env('REACT_QUAY_APP_API_URL'),
        Cypress.config().baseUrl as string,
      );
      cy.visit(redirect);
    });
    cy.contains('Setup Build Trigger:');

    cy.get('#repo-url').type('https://github.com/quay/quay');
    cy.contains('Next').click();
    cy.get('#tag-manifest-with-branch-or-tag-name-checkbox').click();
    cy.contains('Next').click();
    cy.get('#dockerfile-path').type('/Dockerfile');
    cy.contains('Next').click();
    cy.get('#context-path').type('/context');
    cy.contains('Next').click();
    cy.contains('Request failed with status code 500');
  });

  it('displays error on activation', () => {
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/build/?limit=10', {
      fixture: 'builds.json',
    }).as('getBuilds');
    cy.intercept('GET', '/api/v1/repository/testorg/testrepo/trigger/', {
      fixture: 'build-triggers.json',
    }).as('getBuilds');
    cy.intercept(
      'POST',
      '/api/v1/repository/testorg/testrepo/trigger/*/activate',
      {
        statusCode: 500,
      },
    ).as('activateTrigger');
    cy.visit('/repository/testorg/testrepo?tab=builds');

    cy.contains('Create Build Trigger').click();
    cy.origin(Cypress.env('REACT_QUAY_APP_API_URL'), () =>
      cy.on('uncaught:exception', (e) => false),
    );
    cy.contains('Custom Git Repository Push').click();
    cy.url().should('contain', 'repository/testorg/testrepo/trigger/');
    cy.url().then((url) => {
      const redirect = url.replace(
        Cypress.env('REACT_QUAY_APP_API_URL'),
        Cypress.config().baseUrl as string,
      );
      cy.visit(redirect);
    });
    cy.contains('Setup Build Trigger:');

    cy.get('#repo-url').type('https://github.com/quay/quay');
    cy.contains('Next').click();
    cy.get('#tag-manifest-with-branch-or-tag-name-checkbox').click();
    cy.contains('Next').click();
    cy.get('#dockerfile-path').type('/Dockerfile');
    cy.contains('Next').click();
    cy.get('#context-path').type('/context');
    cy.contains('Next').click();
    cy.contains('tr', 'testorg+testrobot2').within(() => {
      cy.contains('Read access will be added if selected');
    });
    cy.contains('Next').click();
    cy.get('#repo-url').contains('https://github.com/quay/quay');
    cy.get('button[type="submit"]').click();
    cy.contains('Error activating trigger');
  });
});

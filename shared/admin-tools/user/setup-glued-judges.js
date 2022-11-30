if (
  !process.env.COGNITO_USER_POOL ||
  !process.env.ELASTICSEARCH_ENDPOINT ||
  !process.env.ENV ||
  !process.env.REGION
) {
  console.error(
    'Required environment variables: COGNITO_USER_POOL, ELASTICSEARCH_ENDPOINT, ENV, REGION',
  );
  process.exit();
}

const createApplicationContext = require('../../../web-api/src/applicationContext');
const {
  MAX_SEARCH_CLIENT_RESULTS,
} = require('../../src/business/entities/EntityConstants');
const { DynamoDB } = require('aws-sdk');
const { getVersion } = require('../util');
const { search } = require('../../src/persistence/elasticsearch/searchClient');

/**
 * Creates a cognito user
 *
 * @param {object} applicationContext the application context
 * @param {string} email              the cognito user's email address
 * @param {string} name               the cognito user's name
 * @param {string} role               the cognito user's role
 * @param {string} userId             the cognito user's userId
 * @returns {Promise<void>}
 */
const createCognitoUser = async ({
  applicationContext,
  email,
  name,
  role,
  userId,
}) => {
  try {
    await applicationContext
      .getCognito()
      .adminCreateUser({
        UserAttributes: [
          {
            Name: 'email_verified',
            Value: 'True',
          },
          {
            Name: 'email',
            Value: email,
          },
          {
            Name: 'custom:role',
            Value: role,
          },
          {
            Name: 'name',
            Value: name,
          },
          {
            Name: 'custom:userId',
            Value: userId,
          },
        ],
        UserPoolId: process.env.COGNITO_USER_POOL,
        Username: email,
      })
      .promise();
    console.log(`Enabled login for ${name}`);
  } catch (err) {
    console.error(`ERROR creating cognito user for ${name}:`, err);
  }
};

/**
 * Deletes a judge user and chambers section mapping
 *   - intended to be used only if a judge has both an imported user and a glued user
 *
 * @param {string} bulkImportedUserId bulk imported user id
 * @param {object} dynamo             DynamoDB object
 * @param {string} judge              Judge name
 * @param {string} version            database version
 * @returns {Promise<void>}
 */
const deleteDuplicateImportedJudgeUser = async ({
  bulkImportedUserId,
  dynamo,
  judge,
  version,
}) => {
  const section = `${judge.toLowerCase()}sChambers`; // TODO: is there a helper for this?
  const TableName = `efcms-${process.env.ENV}-${version}`;

  try {
    await deleteSectionMapping({
      TableName,
      dynamo,
      section,
      userId: bulkImportedUserId,
    });
  } catch (err) {
    console.error(
      `ERROR deleting duplicate chambers section mapping for Judge ${judge}:`,
      err,
    );
    return;
  }

  const userKey = {
    pk: `user|${bulkImportedUserId}`,
    sk: `user|${bulkImportedUserId}`,
  };
  try {
    await dynamo
      .deleteItem({
        Key: userKey,
        TableName,
      })
      .promise();
  } catch (err) {
    console.error(`ERROR deleting duplicate Judge ${judge}:`, err);
  }
  console.log(`Deleted duplicate Judge ${judge}`);
};

/**
 * Deletes a user's section mapping
 *
 * @param {string} section   section name
 * @param {object} dynamo    DynamoDB object
 * @param {string} userId    user id
 * @param {string} TableName dynamo table name
 * @returns {Promise<void>}
 */
const deleteSectionMapping = async ({ dynamo, section, TableName, userId }) => {
  const Key = {
    pk: `section|${section}`,
    sk: `user|${userId}`,
  };
  await dynamo
    .deleteItem({
      Key,
      TableName,
    })
    .promise();
};

/**
 * Retrieves all judge users and formats them in an object structure that reveals duplicates
 *
 * @param {object} applicationContext the application context
 * @returns {object} object containing all users for each judge
 */
const getJudgeUsers = async ({ applicationContext }) => {
  const { results } = await search({
    applicationContext,
    searchParameters: {
      body: {
        from: 0,
        query: {
          bool: {
            must: {
              term: {
                'role.S': {
                  value: 'judge',
                },
              },
            },
          },
        },
        size: MAX_SEARCH_CLIENT_RESULTS,
      },
      index: 'efcms-user',
    },
  });
  let judgeUsers = {};
  for (const judge of results) {
    const emailDomain = judge.email.split('@')[1];
    if (!(judge.name in judgeUsers)) {
      judgeUsers[judge.name] = {
        name: `${judge.judgeTitle} ${judge.name}`,
      };
    }
    judgeUsers[judge.name][emailDomain] = judge.userId;
  }
  return judgeUsers;
};

/**
 * Updates the userId of a cognito user created via bulk import
 *
 * @param {object} applicationContext the application context
 * @param {string} bulkImportedUserId bulk imported user id
 * @param {string} gluedUserId        glued user id
 * @param {string} judge              Judge name
 * @returns {Promise<void>}
 */
const updateImportedCognitoUsersUserIdAttribute = async ({
  applicationContext,
  bulkImportedUserId,
  gluedUserId,
  judge,
}) => {
  try {
    await applicationContext
      .getCognito()
      .adminUpdateUserAttributes({
        UserAttributes: [
          {
            Name: 'custom:userId',
            Value: gluedUserId,
          },
        ],
        UserPoolId: process.env.COGNITO_USER_POOL,
        Username: bulkImportedUserId,
      })
      .promise();
    console.log(`Enabled login for Judge ${judge}`);
  } catch (err) {
    console.error(`ERROR updating custom:userId for Judge ${judge}:`, err);
  }
};

(async () => {
  const applicationContext = createApplicationContext({});
  const version = await getVersion();
  const dynamo = new DynamoDB({ region: process.env.REGION });

  const judgeUsers = await getJudgeUsers({ applicationContext });
  for (const judge in judgeUsers) {
    if (
      'example.com' in judgeUsers[judge] &&
      'ef-cms.ustaxcourt.gov' in judgeUsers[judge]
    ) {
      // this judge was brought over via glue job and was ALSO bulk imported
      const bulkImportedUserId = judgeUsers[judge]['example.com'];
      const gluedUserId = judgeUsers[judge]['ef-cms.ustaxcourt.gov'];

      // delete the bulk imported judge user and chambers section mapping
      //    this removes duplicates from judge drop-downs
      await deleteDuplicateImportedJudgeUser({
        bulkImportedUserId,
        dynamo,
        judge,
        version,
      });

      // change the @example.com cognito user's custom:userId attribute to the glued user's id
      //    this enables login using the judge.name@example.com cognito user created by the bulk import
      await updateImportedCognitoUsersUserIdAttribute({
        applicationContext,
        bulkImportedUserId,
        gluedUserId,
        judge,
      });
    } else if ('ef-cms.ustaxcourt.gov' in judgeUsers[judge]) {
      // this judge was brought over via glue job but not bulk imported
      const email = `judge.${judge.toLowerCase()}@example.com`;
      const { name } = judgeUsers[judge];
      const userId = judgeUsers[judge]['ef-cms.ustaxcourt.gov'];

      // create a cognito user for this judge with the email address judge.name@example.com
      await createCognitoUser({
        applicationContext,
        email,
        name,
        role: 'judge',
        userId,
      });
    }
  }
})();

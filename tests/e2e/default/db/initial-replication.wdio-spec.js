const _ = require('lodash');

const utils = require('@utils');
const browserUtils = require('@utils/browser');
const sentinelUtils = require('@utils/sentinel');
const commonPage = require('@page-objects/default/common/common.wdio.page');
const loginPage = require('@page-objects/default/login/login.wdio.page');

const data = require('./data');

const LOCAL_LOG = '_local/initial-replication';

const getServerDocs = async (docIds) => {
  const result = await utils.db.allDocs({ keys: docIds });
  return result.rows;
};

const userAllowedDocs = data.createHierarchy({ name: 'base', user: true });
const userDeniedDocs = data.createHierarchy({ name: 'other' });

const requiredDocs = [
  '_design/medic-client',
  'settings',
  `org.couchdb.user:${userAllowedDocs.user.username}`,
  'service-worker-meta',
  'resources',
  'branding',
  userAllowedDocs.user.place,
  userAllowedDocs.user.contact._id,
];

const getTranslationIds = async () => {
  const translationDocs = await utils.db.allDocs({
    start_key: 'messages-',
    end_key: 'messages-\ufff0',
  });
  const docIds = translationDocs.rows.map(row => row.id);
  return docIds;
};

const getForms = async () => {
  const formDocs = await utils.db.allDocs({
    start_key: 'form:',
    end_key: 'form:\ufff0',
    include_docs: true,
    attachments: true,
  });
  return formDocs.rows;
};

const validateReplication = async () => {
  const localAllDocsPreSync = await browserUtils.getDocs();
  const docIdsPreSync = data.ids(localAllDocsPreSync);

  await commonPage.sync(false, 7000);

  const localAllDocs = await browserUtils.getDocs();
  const localDocIds = data.ids(localAllDocs);

  // no additional docs to download
  expect(docIdsPreSync).to.have.members(localDocIds);

  const serverAllDocs = await getServerDocs(localDocIds);

  // docs revs are the same
  expect(localAllDocs).to.deep.equal(serverAllDocs);

  const translationIds = await getTranslationIds();
  const forms = await getForms();
  const formIds = data.ids(forms);

  expect(localDocIds).to.include.members(requiredDocs);
  expect(localDocIds).to.include.members(translationIds);

  const localForms = await browserUtils.getDocs(formIds);
  const expectedAttachments = ['model.xml', 'form.html', 'xml'];
  localForms.forEach(form => {
    const attachments = form._attachments;
    const serverForm = forms.find(serverForm => form._id === serverForm.id);

    expect(Object.keys(attachments)).to.have.members(expectedAttachments, `${form._id} has incorrect attachments`);
    expectedAttachments.forEach(attName =>
      expect(attachments[attName].data).to.deep.equal(serverForm.doc._attachments[attName].data)
    );
  });

  expect(localDocIds).to.include.members(data.ids(userAllowedDocs.clinics));
  expect(localDocIds).to.include.members(data.ids(userAllowedDocs.persons));
  expect(localDocIds).to.include.members(data.ids(userAllowedDocs.reports));

  const replicatedDeniedDocs = _.intersection(
    localDocIds,
    data.ids([...userDeniedDocs.clinics, ...userDeniedDocs.persons, ...userDeniedDocs.reports])
  );
  expect(replicatedDeniedDocs).to.deep.equal([]);

  const initalReplicationLog = await browserUtils.getDoc(LOCAL_LOG);
  expect(initalReplicationLog.complete).to.equal(true);
};

const refreshAndWaitForAngular = async () => {
  await browser.refresh();
  await commonPage.waitForAngularLoaded(3000);
};

describe('initial-replication', () => {
  before(async () => {
    // we're creating ~2000 docs
    await utils.saveDocs([...userAllowedDocs.places, ...userDeniedDocs.places]);
    await utils.createUsers([userAllowedDocs.user]);

    await sentinelUtils.waitForSentinel();
    await utils.stopSentinel();

    await utils.saveDocs(userAllowedDocs.clinics);
    await utils.saveDocs(userDeniedDocs.clinics);

    await utils.saveDocs(userAllowedDocs.persons);
    await utils.saveDocs(userDeniedDocs.persons);

    await utils.saveDocs(userAllowedDocs.reports);
    await utils.saveDocs(userDeniedDocs.reports);
  });

  after(async () => {
    await sentinelUtils.skipToSeq();
    await utils.startSentinel();
  });

  afterEach(async () => {
    await browser.reloadSession();
    await browser.url('/');
  });

  it('should log user in', async () => {
    await loginPage.login(userAllowedDocs.user);

    await validateReplication();

    // does not restart initial replication on refresh
    await browser.refresh();
    await commonPage.waitForAngularLoaded(3000);

    // supports reloading the page while offline
    await browser.throttle('offline');
    await refreshAndWaitForAngular();
    await browser.throttle('online');

    // it should not restart initial replication if the local doc is missing on refresh
    await browserUtils.deleteDoc(LOCAL_LOG);
    await refreshAndWaitForAngular();

    // it should support reloading the page while offline
    await browser.throttle('offline');
    await refreshAndWaitForAngular();
  });

  it('should support "disconnects"', async () => {
    loginPage.login({ ...userAllowedDocs.user, loadPage: false });
    setTimeout(() => browser.refresh(), 1000);
    setTimeout(() => browser.refresh(), 3000);
    setTimeout(() => browser.refresh(), 5000);

    await commonPage.waitForPageLoaded();
    await validateReplication();
  });
});

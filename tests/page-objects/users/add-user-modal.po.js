const helper = require('../../helper');
const errorMessagePassword = element(by.css('#edit-password ~ .help-block'));
const errorMessageUserName = element.all(by.css('span.help-block.ng-binding')).get(0);
const facilitySelector = element(by.css('#facilitySelect ~ .help-block'));
const contactSelector = element(by.css('#contactSelect ~ .help-block')); 
const messageTab = element(by.css('.inbox.page'));

const getUsernameField = () => {
  return element(by.id('edit-username'));
};

const getFullNameField = () => {
  return element(by.id('fullname'));
};

const getPhoneField = () => {
  return element(by.id('phone'));
};

const getEmailField = () => {
  return element(by.id('email'));
};
const getLanguageField = () => {
  return element(by.id('language'));
};

const getRoleField = () => {
  return element(by.id('role'));
};

const getPasswordField = () => {
  return element(by.id('edit-password'));
};

const getConfirmPasswordField = () => {
  return element(by.id('edit-password-confirm'));
};
const getSubmitButton = () => {
  return element(by.css('.btn.submit.btn-primary:not(.ng-hide)'));
};

const getCancelButton = () => {
  return element(by.className('btn cancel'));
};

module.exports = {
  submit: () => {
    helper.waitUntilReady(getSubmitButton());
    getSubmitButton().click();
  },

  cancel: () => {
    helper.waitUntilReady(getCancelButton());
    getCancelButton().click();
  },

  fillForm: (username, fullName, password) => {
    helper.waitUntilReady(getSubmitButton()); // wait for form to load
    getUsernameField().sendKeys(username);
    getFullNameField().sendKeys(fullName);
    getEmailField().sendKeys('tester@mobile.org');
    getPhoneField().sendKeys('0064212134566');
    helper.selectDropdownByValue(getLanguageField(), 'en', 2);
    helper.selectDropdownByValue(getRoleField(), 'string:national_admin');
    getPasswordField().sendKeys(password);
    getConfirmPasswordField().sendKeys(password);
  },
  
  getErrorMessagePassword: () =>{
    return errorMessagePassword.getText();
  }, 

  getErrorMessageUserName: () =>{
    helper.waitUntilReady(errorMessageUserName);
    return errorMessageUserName.getText();
  },

  getFacilitySelector :() => {
    return facilitySelector.getText();
  },

  getContactSelector :() => {
    return contactSelector.getText();
  },
  waitForPageToLoad: () => {
    helper.waitUntilReady(messageTab);
  }

};

import './index.scss';

import '../../node_modules/@fortawesome/fontawesome-svg-core/styles.css';

import { AppComponentPublic } from './views/AppComponentPublic';
import { Container } from '@cerebral/react';
import {
  back,
  createObjectURL,
  externalRoute,
  revokeObjectURL,
  route,
  router,
} from './routerPublic';

// Icons - Solid
import { faArrowAltCircleLeft as faArrowAltCircleLeftSolid } from '@fortawesome/free-solid-svg-icons/faArrowAltCircleLeft';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons/faCheckCircle';
import { faEnvelope as faEnvelopeSolid } from '@fortawesome/free-solid-svg-icons/faEnvelope';
import { faFileAlt as faFileAltSolid } from '@fortawesome/free-solid-svg-icons/faFileAlt';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons/faFilePdf';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons/faInfoCircle';
import { faLock } from '@fortawesome/free-solid-svg-icons/faLock';
import { faLongArrowAltUp } from '@fortawesome/free-solid-svg-icons/faLongArrowAltUp';
import { faPhone } from '@fortawesome/free-solid-svg-icons/faPhone';
import { faPrint } from '@fortawesome/free-solid-svg-icons/faPrint';
import { faSearch } from '@fortawesome/free-solid-svg-icons/faSearch';
import { faSync } from '@fortawesome/free-solid-svg-icons/faSync';
import { faTimesCircle } from '@fortawesome/free-solid-svg-icons/faTimesCircle';

// Icons - Regular
import { faArrowAltCircleLeft as faArrowAltCircleLeftRegular } from '@fortawesome/free-regular-svg-icons/faArrowAltCircleLeft';
import { faTimesCircle as faTimesCircleRegular } from '@fortawesome/free-regular-svg-icons/faTimesCircle';
import { faUser } from '@fortawesome/free-regular-svg-icons/faUser';
import { isFunction, mapValues } from 'lodash';
import { library } from '@fortawesome/fontawesome-svg-core';
import { presenter } from './presenter/presenter-public';
import App from 'cerebral';
import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Instantiates the Cerebral app with React
 */
const appPublic = {
  initialize: (applicationContext, debugTools) => {
    const withAppContextDecorator = (f, context) => {
      return get => f(get, context || applicationContext);
    };

    // decorate all computed functions so they receive applicationContext as second argument ('get' is first)
    presenter.state = mapValues(presenter.state, value => {
      if (isFunction(value)) {
        return withAppContextDecorator(value, applicationContext);
      }
      return value;
    });

    library.add(
      faFileAltSolid,
      faLock,
      faLongArrowAltUp,
      faPrint,
      faFilePdf,
      faSearch,
      faSync,
      faTimesCircle,
      faInfoCircle,
      faCheckCircle,
      faEnvelopeSolid,
      faPhone,
      faTimesCircleRegular,
      faArrowAltCircleLeftSolid,
      faArrowAltCircleLeftRegular,
      faUser,
    );

    presenter.providers.applicationContext = applicationContext;
    presenter.state.cognitoLoginUrl = applicationContext.getCognitoLoginUrl();

    presenter.state.constants = applicationContext.getConstants();

    const advancedSearchTab = applicationContext
      .getUseCases()
      .getItemInteractor(applicationContext, { key: 'advancedSearchTab' });

    if (advancedSearchTab) {
      presenter.state.advancedSearchTab = advancedSearchTab;
    }

    const advancedSearchForm = applicationContext
      .getUseCases()
      .getItemInteractor(applicationContext, { key: 'advancedSearchForm' });

    if (advancedSearchForm) {
      presenter.state.advancedSearchForm = advancedSearchForm;
    }

    presenter.providers.router = {
      back,
      createObjectURL,
      externalRoute,
      revokeObjectURL,
      route,
    };

    const cerebralApp = App(presenter, debugTools);

    applicationContext
      .getUseCases()
      .getCurrentVersionInteractor(applicationContext)
      .then(version => {
        setInterval(async () => {
          const currentVersion = await applicationContext
            .getUseCases()
            .getCurrentVersionInteractor(applicationContext);
          if (currentVersion !== version) {
            await cerebralApp.getSequence('persistFormsOnReloadSequence')();
          }
        }, process.env.CHECK_DEPLOY_DATE_INTERVAL || 60000);
      })
      .then(() => {
        router.initialize(cerebralApp);

        ReactDOM.render(
          <Container app={cerebralApp}>
            <AppComponentPublic />
            {process.env.CI && (
              <div id="ci-environment">CI Test Environment</div>
            )}
          </Container>,
          window.document.querySelector('#app-public'),
        );
      });
  },
};

export { appPublic };

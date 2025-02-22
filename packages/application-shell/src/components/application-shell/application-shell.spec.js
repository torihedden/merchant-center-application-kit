import React from 'react';
import { shallow } from 'enzyme';
import { DOMAINS, LOGOUT_REASONS } from '@commercetools-frontend/constants';
import { reportErrorToSentry } from '@commercetools-frontend/sentry';
import { AsyncLocaleData } from '@commercetools-frontend/i18n';
import { ApplicationContextProvider } from '@commercetools-frontend/application-shell-connectors';
import * as appShellUtils from '../../utils';
import ConfigureIntlProvider from '../configure-intl-provider';
import ProjectContainer from '../project-container';
import FetchUser from '../fetch-user';
import FetchProject from '../fetch-project';
import AppBar from '../app-bar';
import NavBar, { LoadingNavBar } from '../navbar';
import ApplicationShellProvider from '../application-shell-provider';
import { getBrowserLocale } from '../application-shell-provider/utils';
import ApplicationShell, {
  RestrictedApplication,
  MainContainer,
} from './application-shell';

jest.mock('@commercetools-frontend/sentry');
jest.mock('../../utils');

const createTestProps = props => ({
  applicationMessages: {
    en: { 'CustomApp.title': 'Title en' },
    'en-US': { 'CustomApp.title': 'Title' },
    de: { 'CustomApp.title': 'Titel' },
  },
  environment: {
    applicationName: 'my-app',
    frontendHost: 'localhost:3001',
    mcApiUrl: 'https://mc-api.commercetools.com',
    location: 'eu',
    env: 'development',
    cdnUrl: 'http://localhost:3001',
    servedByProxy: false,
  },
  trackingEventWhitelist: {},
  render: jest.fn(),
  notificationsByDomain: {
    global: [],
    page: [],
    side: [],
  },
  showNotification: jest.fn(),
  showApiErrorNotification: jest.fn(),
  showUnexpectedErrorNotification: jest.fn(),
  onRegisterErrorListeners: jest.fn(),
  ...props,
});

const testLocaleData = {
  isLoading: false,
  locale: 'en',
  messages: { 'AppKit.title': 'Title en', 'CustomApp.title': 'Title en' },
};

const renderForAsyncData = ({ props, userData, localeData = testLocaleData }) =>
  shallow(<RestrictedApplication {...props} />)
    .find(FetchUser)
    .renderProp('children')(userData)
    .find(AsyncLocaleData)
    .renderProp('children')(localeData);

describe('<RestrictedApplication>', () => {
  let props;
  let wrapper;
  let userData;
  let localeData;
  describe('rendering', () => {
    beforeEach(() => {
      window.location.replace = jest.fn();
      props = createTestProps();
      userData = {
        isLoading: false,
        user: {
          id: 'u1',
          email: 'john.snow@got.com',
          gravatarHash: '20c9c1b252b46ab49d6f7a4cee9c3e68',
          firstName: 'John',
          lastName: 'Snow',
          projects: {
            total: 0,
            results: [],
          },
          defaultProjectKey: 'foo-0',
          language: 'en-US',
          launchdarklyTrackingId: '123',
          launchdarklyTrackingGroup: 'ct',
          launchdarklyTrackingTeam: ['abc', 'def'],
          launchdarklyTrackingTenant: 'xy',
        },
      };
      wrapper = renderForAsyncData({ props, userData });
    });
    describe('when user is loading', () => {
      beforeEach(() => {
        reportErrorToSentry.mockClear();
        props = createTestProps();
        userData = {
          isLoading: true,
        };
        wrapper = shallow(<RestrictedApplication {...props} />)
          .find(FetchUser)
          .renderProp('children')(userData);
      });
      it('should pass "locale" as undefined to <AsyncLocaleData>', () => {
        expect(wrapper.find(AsyncLocaleData)).toHaveProp('locale', undefined);
      });
      it('should pass "user" as undefined to <ApplicationContextProvider>', () => {
        expect(wrapper.find(ApplicationContextProvider)).toHaveProp(
          'user',
          undefined
        );
      });
      it('should pass "environment" to <ApplicationContextProvider>', () => {
        expect(wrapper.find(ApplicationContextProvider)).toHaveProp(
          'environment',
          props.environment
        );
      });
    });
    describe('when user is loaded', () => {
      beforeEach(() => {
        reportErrorToSentry.mockClear();
        props = createTestProps();
        wrapper = shallow(<RestrictedApplication {...props} />)
          .find(FetchUser)
          .renderProp('children')(userData);
      });
      it('should pass "user" to <ApplicationContextProvider>', () => {
        expect(wrapper.find(ApplicationContextProvider)).toHaveProp(
          'user',
          userData.user
        );
      });
      it('should pass "environment" to <ApplicationContextProvider>', () => {
        expect(wrapper.find(ApplicationContextProvider)).toHaveProp(
          'environment',
          props.environment
        );
      });
    });
    describe('when locale data is loading', () => {
      beforeEach(() => {
        reportErrorToSentry.mockClear();
        wrapper = shallow(<RestrictedApplication {...props} />)
          .find(FetchUser)
          .renderProp('children')(userData)
          .find(AsyncLocaleData)
          .renderProp('children')({
          isLoading: true,
          locale: null,
          messages: null,
        });
      });
      it('should not pass "locale" prop to <ConfigureIntlProvider>', () => {
        expect(wrapper.find(ConfigureIntlProvider)).not.toHaveProp('locale');
      });
      it('should not pass "messages" prop to <ConfigureIntlProvider>', () => {
        expect(wrapper.find(ConfigureIntlProvider)).not.toHaveProp('messages');
      });
    });
    describe('when fetching the user returns an error', () => {
      beforeEach(() => {
        reportErrorToSentry.mockClear();
        props = createTestProps();
        userData = {
          isLoading: false,
          error: new Error('Failed to fetch'),
        };
        wrapper = renderForAsyncData({ props, userData });
      });
      it('should pass "locale" to <ConfigureIntlProvider>', () => {
        expect(wrapper.find(ConfigureIntlProvider)).toHaveProp('locale', 'en');
      });
      it('should render <ErrorApologizer>', () => {
        expect(wrapper).toRender('ErrorApologizer');
      });
      it('should report error to sentry', () => {
        expect(reportErrorToSentry).toHaveBeenCalledWith(
          new Error('Failed to fetch'),
          {}
        );
      });
      it('should pass default "messages" to <ConfigureIntlProvider>', () => {
        expect(wrapper.find(ConfigureIntlProvider)).toHaveProp(
          'messages',
          expect.objectContaining({
            'AppKit.title': 'Title en',
          })
        );
      });
      it('should pass application "messages" to <ConfigureIntlProvider>', () => {
        expect(wrapper.find(ConfigureIntlProvider)).toHaveProp(
          'messages',
          expect.objectContaining({
            'CustomApp.title': 'Title en',
          })
        );
      });
      it('should not render <ApplicationContextProvider>', () => {
        expect(wrapper).not.toRender(ApplicationContextProvider);
      });
    });

    describe('layout', () => {
      it('should render "global-notifications" container inside "application-layout"', () => {
        expect(
          wrapper.find({ role: 'application-layout' }).find({
            role: 'global-notifications',
          })
        ).toBeDefined();
      });
      it('should render "header" element inside "application-layout"', () => {
        expect(
          wrapper.find({ role: 'application-layout' }).find({ role: 'header' })
        ).toBeDefined();
      });
      it('should render "aside" element inside "application-layout"', () => {
        expect(
          wrapper.find({ role: 'application-layout' }).find({ role: 'aside' })
        ).toBeDefined();
      });
      it('should render "main" container inside "application-layout"', () => {
        expect(
          wrapper.find({ role: 'application-layout' }).find({ role: 'main' })
        ).toBeDefined();
      });
    });
    it('should render GLOBAL <NotificationsList>', () => {
      expect(wrapper.find('NotificationsList').at(0)).toHaveProp(
        'domain',
        DOMAINS.GLOBAL
      );
    });
    it('should render PAGE <NotificationsList>', () => {
      expect(wrapper.find('NotificationsList').at(1)).toHaveProp(
        'domain',
        DOMAINS.PAGE
      );
    });
    it('should render SIDE <NotificationsList>', () => {
      expect(wrapper.find('NotificationsList').at(2)).toHaveProp(
        'domain',
        DOMAINS.SIDE
      );
    });
    it('should render <AppBar> below header element', () => {
      expect(wrapper.find('header').find(AppBar)).toBeDefined();
    });
    describe('<NavBar>', () => {
      let wrapperAside;
      describe('when there is a project key in the url', () => {
        let project;
        beforeEach(() => {
          appShellUtils.selectProjectKeyFromUrl.mockReturnValue('foo-1');
          wrapper = renderForAsyncData({ props, userData });
          project = {
            key: 'foo-1',
            version: 1,
            name: 'Foo 1',
            countries: ['us'],
            currencies: ['USD'],
            languages: ['en'],
            owner: {
              id: 'foo-id',
            },
            permissions: { canManageProjectSettings: true },
            menuVisibilities: { hideDashboard: true },
            actionRights: null,
            dataFences: null,
          };
          wrapperAside = wrapper
            .find({ role: 'aside' })
            .find(FetchProject)
            .renderProp('children')({
            isLoading: false,
            project,
          });
        });
        it('should pass "user" to <ApplicationContextProvider>', () => {
          expect(wrapperAside.find(ApplicationContextProvider)).toHaveProp(
            'user',
            userData.user
          );
        });
        it('should pass "project" to <ApplicationContextProvider>', () => {
          expect(wrapperAside.find(ApplicationContextProvider)).toHaveProp(
            'project',
            project
          );
        });
        it('should pass "environment" to <ApplicationContextProvider>', () => {
          expect(wrapperAside.find(ApplicationContextProvider)).toHaveProp(
            'environment',
            props.environment
          );
        });
        it('should pass the projectKey matched from the URL', () => {
          expect(wrapperAside.find(NavBar)).toHaveProp('projectKey', 'foo-1');
        });
        it('should pass the application language', () => {
          expect(wrapperAside.find(NavBar)).toHaveProp(
            'applicationLocale',
            'en'
          );
        });
        it('should pass "environment"', () => {
          expect(wrapperAside.find(NavBar)).toHaveProp(
            'environment',
            props.environment
          );
        });
        describe('when user, locale and project are loading', () => {
          beforeEach(() => {
            userData = {
              isLoading: true,
            };
            localeData = {
              isLoading: true,
            };
            wrapper = renderForAsyncData({ props, userData, localeData });
            wrapperAside = wrapper
              .find({ role: 'aside' })
              .find(FetchProject)
              .renderProp('children')({
              isLoading: true,
            });
          });
          it('should render <LoadingNavBar>', () => {
            expect(wrapperAside).toRender(LoadingNavBar);
          });
        });
        describe('when user is loaded, locale and project are loading', () => {
          beforeEach(() => {
            localeData = {
              isLoading: true,
            };
            wrapper = renderForAsyncData({ props, userData, localeData });
            wrapperAside = wrapper
              .find({ role: 'aside' })
              .find(FetchProject)
              .renderProp('children')({
              isLoading: true,
            });
          });
          it('should render <LoadingNavBar>', () => {
            expect(wrapperAside).toRender(LoadingNavBar);
          });
        });
        describe('when user and locale data are loaded, project is loading', () => {
          beforeEach(() => {
            wrapper = renderForAsyncData({ props, userData });
            wrapperAside = wrapper
              .find({ role: 'aside' })
              .find(FetchProject)
              .renderProp('children')({
              isLoading: true,
            });
          });
          it('should render <LoadingNavBar>', () => {
            expect(wrapperAside).toRender(LoadingNavBar);
          });
        });
      });
      describe('when there is no project key in the url', () => {
        beforeEach(() => {
          appShellUtils.selectProjectKeyFromUrl.mockReturnValue();
          wrapper = renderForAsyncData({ props, userData });
          wrapperAside = wrapper.find({ role: 'aside' });
        });
        it('should not render <LoadingNavBar>', () => {
          expect(wrapperAside).not.toRender(LoadingNavBar);
        });
        it('should not render <NavBar>', () => {
          expect(wrapperAside).not.toRender(NavBar);
        });
      });
    });
    it('should render <Route> for "/account"', () => {
      expect(wrapper.find(MainContainer)).toRender({
        path: '/account',
        render: props.render,
      });
    });
    it('should render <Route> for redirect to "/account"', () => {
      expect(wrapper.find(MainContainer)).toRender({ to: '/account/profile' });
    });
    it('should render <Route> matching ":projectKey" path', () => {
      expect(wrapper.find(MainContainer)).toRender({
        exact: false,
        path: '/:projectKey',
      });
    });
    describe('project container <Route>', () => {
      let routerProps;
      beforeEach(() => {
        routerProps = {
          location: { pathname: '/test-project/products' },
          match: { params: { projectKey: 'foo-1' } },
        };
        wrapper = wrapper
          .find(MainContainer)
          .find({ exact: false, path: '/:projectKey' })
          .renderProp('render')(routerProps);
      });
      it('should pass "match" to <ProjectContainer>', () => {
        expect(wrapper.find(ProjectContainer)).toHaveProp(
          'match',
          routerProps.match
        );
      });
      it('should pass "render" to <ProjectContainer>', () => {
        expect(wrapper.find(ProjectContainer)).toHaveProp(
          'render',
          props.render
        );
      });
    });
    it('should render <Route> matching "/" path', () => {
      expect(wrapper.find(MainContainer)).toRender({
        path: '/',
      });
    });
  });
});

describe('when user is not logged in', () => {
  let props;
  let wrapper;
  describe('rendering', () => {
    beforeEach(() => {
      props = createTestProps();
      wrapper = shallow(<ApplicationShell {...props} />)
        .find(ApplicationShellProvider)
        .renderProp('children')({ isAuthenticated: false });
    });
    describe('catch <Route>', () => {
      let renderWrapper;
      let routerProps;
      beforeEach(() => {
        routerProps = {
          location: { pathname: '/foo' },
        };
        renderWrapper = wrapper.find('Route').renderProp('render')(routerProps);
      });
      it('should redirect "/login"', () => {
        expect(renderWrapper).toHaveProp('to', 'login');
      });
      it('should pass location', () => {
        expect(renderWrapper).toHaveProp('location', routerProps.location);
      });
      it('should pass queryParams', () => {
        expect(renderWrapper).toHaveProp('queryParams', {
          reason: LOGOUT_REASONS.UNAUTHORIZED,
          redirectTo: `${window.location.origin}${routerProps.location.pathname}`,
        });
      });
    });
  });
});

describe('lifecycle', () => {
  let props;
  let wrapper;
  beforeEach(() => {
    props = createTestProps();
    wrapper = shallow(<ApplicationShell {...props} />);
  });
  describe('componentDidMount', () => {
    beforeEach(() => {
      wrapper.instance().componentDidMount();
    });
    it('should call onRegisterErrorListeners', () => {
      expect(props.onRegisterErrorListeners).toHaveBeenCalled();
    });
  });
});

describe('getBrowserLocale', () => {
  let testWindow;
  describe('when the locale is supported by the MC', () => {
    beforeEach(() => {
      testWindow = {
        navigator: {
          language: 'de-DE',
        },
      };
    });
    it('should return the locale', () => {
      expect(getBrowserLocale(testWindow)).toBe('de-DE');
    });
  });
  describe('when locale is not supported by the MC', () => {
    beforeEach(() => {
      testWindow = {
        navigator: {
          language: 'hu',
        },
      };
    });
    it('should return the default locale, `en`', () => {
      expect(getBrowserLocale(testWindow)).toBe('en');
    });
  });
});

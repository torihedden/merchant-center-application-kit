# Test Utils

If you'd like to write integration tests using `@testing-library/react`](https://github.com/testing-library/react-testing-library), we expose some **test utils** which simulate the components-under-test as if it was rendered by the `<ApplicationShell>`.

We want to make it easy to test features of the application you're building with `ApplicationShell`. `ApplicationShell` renders your components with quite some context. It should be easy to influence this context in the tests so that your component can be tested under different circumstances as rendered by `ApplicationShell`.

The `ApplicationShell` provides the following context:

- `IntlProvider` for i18n and l10n ([`react-intl`](https://github.com/yahoo/react-intl))
- `ApolloProvider` for GraphQL ([`react-apollo`](https://github.com/apollographql/react-apollo))
- `ConfigureFlopFlip` for feature-toggles ([`flopflip`](https://github.com/tdeekens/flopflip))
- `ApplicationContextprovider` for information about the MC application like `user`, `project`, `environment`, `dataLocale` and `permissions` ([`application-shell-connectors`](https://github.com/commercetools/merchant-center-application-kit/blob/master/packages/application-shell-connectors/src/components/application-context/README.md))
- `Router` for routing ([`react-router`](https://github.com/ReactTraining/react-router))

## Table of Contents

- [@testing-library/react](#@testing-library/react)
- [test-utils](#test-utils-1)
  - [Basics](#basics)
  - [API](#api)
    - [renderApp(ui: ReactElement, options: Object)](#renderappui-reactelement-options-object)
    - [renderAppWithRedux(ui: ReactElement, options: Object)](#renderappwithreduxui-reactelement-options-object)
  - [Examples](#examples)
    - [`locale` (`react-intl`)](#locale-react-intl)
    - [`dataLocale` (Localisation)](#datalocale-localisation)
    - [`mocks` (GraphQL)](#mocks-graphql)
    - [`sdkMocks` (Redux)](#sdkmocks-redux)
    - [`flags` (Feature Flags)](#flags-feature-flags)
    - [Application Contenxt](#application-context)
    - [Permissions](#permissions)
    - [Router (`react-router`)](#router-react-router)

## `@testing-library/react`

[`@testing-library/react`](https://github.com/testing-library/react-testing-library) allows you to interact with the component using the DOM. It is a great testing library due to its philosophy of testing from a user-perspective, instead of testing the implementation. The assertions are written against the produced DOM, and the component-under-test is interacted with using DOM events.

The `render` method exposed by `@testing-library/react` is used to render your component and returns a bunch of getters to query the DOM produced by the component-under-test. `ApplicationShell`s `test-utils` export an enhanced `renderApp` method which adds more context to the component-under-test, so that it can be rendered as-if it was rendered by `ApplicationShell` itself.

> All exports of `@testing-library/react` are re-exported from `test-utils`.

## `test-utils`

### Basics

This section will introduce you to testing with `test-utils`.
Let's assume a simple component which prints the authenticated user's first name.

```jsx
const FirstName = () => (
  <ApplicationContext
    render={applicationContext =>
      applicationContext.user ? applicationContext.user.firstName : 'Anonymous'
    }
  />
);
```

This component uses [`ApplicationContext`](https://github.com/commercetools/merchant-center-application-kit/blob/master/packages/application-shell-connectors/src/components/application-context/README.md) which allows it to access the `applicationContext` provided by `ApplicationShell`.

A test which verifies the authenticated user's first name being rendered by this component can look like this:

```jsx
import { renderApp } from '@commercetools-frontend/application-shell/test-utils';

describe('FirstName', () => {
  it('should render the authenticated users first name', () => {
    const { container, user } = renderApp(<FirstName />);
    expect(container).toHaveTextContent('Sheldon');
  });
});
```

This test renders the `FirstName` component and then verifies that the name _"Sheldon"_ gets printed. _"Sheldon"_ is the name of our default user in tests. You can find the default test data [here](packages/application-shell/src/test-utils.js).

We can make the test more robust by explicitly declaring the authenticated users first name. This ensures the test keeps working even when the defaults change, and makes it easier to follow.

```jsx
import { renderApp } from '@commercetools-frontend/application-shell/test-utils';

describe('FirstName', () => {
  it('should render the authenticated users first name', () => {
    const { container, user } = renderApp(<FirstName />, {
      user: {
        firstName: 'Leonard',
      },
    });
    expect(container).toHaveTextContent('Leonard');
  });
});
```

Here we overwrite the authenticated user's `firstName` for our test. The data we pass in gets merged with the default data.

We can also test the case in which no user is authenticated by passing `{ user: null }`:

```jsx
import { renderApp } from '@commercetools-frontend/application-shell/test-utils';

describe('FirstName', () => {
  it('should render the authenticated users first name', () => {
    const { container, user } = renderApp(<FirstName />, { user: null });
    expect(container).toHaveTextContent('Anonymous');
  });
});
```

When passing `null` for `user` the default `user` will not be added to the context and the component-under-test will get rendered as-if no user was authenticated. This also works for `project` and `environment` as you will see below.

### API

This section describes the methods exported by `@commercetools-frontend/application-shell/test-utils`.

`test-utils` is builds on top of `@testing-library/react`, so all [`@testing-library/react`](https://github.com/testing-library/react-testing-library) exports are available. The following section describes the additional exports added on top of `@testing-library/react`.

#### `renderApp(ui: ReactElement, options: Object)`

| Argument              | Type          | Concern                                                                                                                                                                                            | Description                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui`                  | React Element | React                                                                                                                                                                                              | React Element to render.                                                                                                                                                                                                                                                                                                                                                           |
| `options.locale`      | `String`      | Localisation                                                                                                                                                                                       | Determines the UI language and number format. Is used to configure `IntlProvider`. Only _core_ messages will be available during tests, no matter the `locale`. The locale can be a full [IETF language tag](https://en.wikipedia.org/wiki/IETF_language_tag), although the MC is currently only available in a limited set of languages.                                          |
| `options.dataLocale`  | `String`      | Localisation                                                                                                                                                                                       | Sets the locale which is used to display [`LocalizedString`](https://docs.commercetools.com/http-api-types#localizedstring)s.                                                                                                                                                                                                                                                      |
| `options.mocks`       | `Array`       | Apollo                                                                                                                                                                                             | Allows mocking requests made with Apollo. `mocks` is forwarded as the `mocks` argument to [`MockedProvider`](https://www.apollographql.com/docs/guides/testing-react-components.html#MockedProvider).                                                                                                                                                                              |
| `options.addTypename` | `Boolean`     | Apollo                                                                                                                                                                                             | If queries are lacking `__typename` (which happens when mocking) it’s important to pass `addTypename: false`, which is the default. See [`MockedProvider.addTypename`](https://www.apollographql.com/docs/guides/testing-react-components.html#addTypename) for more information.                                                                                                  |
| `options.route`       | `String`      | Routing                                                                                                                                                                                            | The route the user is on, like `/test-project/products`. Defaults to `/`.                                                                                                                                                                                                                                                                                                          |
| `options.history`     | `Object`      | Routing                                                                                                                                                                                            | By default a memory-history is generated which has the provided `options.route` set as its initial history entry. It's possible to pass a custom history as well. In that case, we recommend using the factory function `createEnhancedHistory` from the `@commercetools-frontend/browser-history` package, as it contains the enhanced `location` with the parsed `query` object. |
| `options.adapter`     | `Object`      | Feature Toggles                                                                                                                                                                                    | The [flopflip](https://github.com/tdeekens/flopflip) adapter to use when configuring `flopflip`. Defaults to [`memoryAdapter`](https://github.com/tdeekens/flopflip/tree/master/packages/memory-adapter).                                                                                                                                                                          |
| `options.flags`       | `Object`      | Feature Toggles                                                                                                                                                                                    | An object whose keys are feature-toggle keys and whose values are their toggle state. Use this to test your component with different feature toggle combinations. Example: `{ betaUserProfile: true }`.                                                                                                                                                                            |
| `options.environment` | `Object`      | [Application Context](https://github.com/commercetools/merchant-center-application-kit/blob/master/packages/application-shell-connectors/src/components/application-context/README.md#environment) | Allows to set the `applicationContext.environment`. The passed object gets merged with the tests default environment. Pass `null` to completely remove the `environment`, which renders the `ui` as if no `environment` was given.                                                                                                                                                 |
| `options.user`        | `Object`      | [Application Context](https://github.com/commercetools/merchant-center-application-kit/blob/master/packages/application-shell-connectors/src/components/application-context/README.md#user)        | Allows to set the `applicationContext.user`. The passed object gets merged with the tests default user. Pass `null` to completely remove the `user`, which renders the `ui` as if no user was authenticated.                                                                                                                                                                       |
| `options.project`     | `Object`      | [Application Context](https://github.com/commercetools/merchant-center-application-kit/blob/master/packages/application-shell-connectors/src/components/application-context/README.md#project)     | Allows to set the `applicationContext.project`. The passed object gets merged with the tests default project. Pass `null` to completely remove the `project` which renders the `ui` outside of a project context.                                                                                                                                                                  |
| `options.gtmTracking` | `Object`      | [Gtm Context](https://github.com/commercetools/merchant-center-application-kit/blob/master/packages/application-shell/src/components/gtm-booter/gtm-booter.js)                                     | Allows to overwrite gtm tracking functions: `{ track, getHierarchy }`. Defaults to `jest.fn()`                                                                                                                                                                                                                                                                                     |

**Additional return values**

Calling `renderApp` returns an object which contains all keys `@testing-library/react`'s original `render` method contains, but also contains these additional entries:

| Entry         | Type     | Description                                                                                                                                                                                                                                                                                                       |
| ------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `history`     | `Object` | The history created by `renderApp` which is passed to the rotuer. It can be used to simulate location changes and so on.                                                                                                                                                                                          |
| `user`        | `Object` | The `user` object used to configure `ApplicationContextProvider`, so the result of merging the default user with `options.user`. Note that this is not the same as `applicationContext.user`. Can be `undefined` when no user is authenticated (when `options.user` was `null`).                                  |
| `project`     | `Object` | The `project` object used to configure `ApplicationContextProvider`, so the result of merging the default project with `options.project`. Note that this is not the same as `applicationContext.project`. Can be `undefined` when no project was set (when `options.project` was `null`).                         |
| `environment` | `Object` | The `environment` object used to configure `ApplicationContextProvider`, so the result of merging the default environment with `options.environment`. Note that this is not the same as `applicationContext.environment`. Can be `undefined` when no environment was set (when `options.environment` was `null`). |

#### `renderAppWithRedux(ui: ReactElement, options: Object)`

> This function might change in the future. Use with caution.

This render function simply wraps the `renderApp` with some components related to Redux.
It's recommended to use this render function if some of your component-under-test uses Redux `connect`.

The function accepts all options from `renderApp` plus the following:

| Argument                             | Type       | Concern | Description                                                                                                                                                                                                                                                    |
| ------------------------------------ | ---------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `options.store`                      | `Object`   | Redux   | A custom redux store.                                                                                                                                                                                                                                          |
| `options.storeState`                 | `Object`   | Redux   | Pass an initial state to the default Redux store.                                                                                                                                                                                                              |
| `options.sdkMocks`                   | `Array`    | Redux   | Allows mocking requests made with `@commercetools-frontend/sdk` (Redux). The `sdkMocks` is forwarded as `mocks` to the [SDK `test-utils`](https://github.com/commercetools/merchant-center-application-kit/blob/master/packages/sdk/src/test-utils/README.md). |
| `options.mapNotificationToComponent` | `Function` | Redux   | Pass a function to map a notification to a custom component.                                                                                                                                                                                                   |

### Examples

#### `locale` (`react-intl`)

The component-under-test will get rendered in `react-intl`s `IntlProvider`. During tests, the core-messages will be used. It's still possible to use a different locale though.

```jsx
const Flag = props => {
  const intl = useIntl();

  if (intl.locale.startsWith('en-US')) return '🇺🇸';
  if (intl.locale.startsWith('en')) return '🇬🇧';
  if (intl.locale.startsWith('de')) return '🇩🇪';
  return '🏳️';
};

export default Flag;
```

```jsx
import { renderApp } from '@commercetools-frontend/application-shell/test-utils';
import Flag from './flag';

describe('Flag', () => {
  it('should render the british flag when the locale is english', () => {
    const { container } = renderApp(<Flag />);
    expect(container).toHaveTextContent('🇬🇧');
  });
  it('should render the german flag when the locale is german', () => {
    const { container } = renderApp(<Flag />, { locale: 'de' });
    expect(container).toHaveTextContent('🇩🇪');
  });
});
```

#### `dataLocale` (Localisation)

```jsx
export const ProductName = props => (
  <ApplicationContext
    render={applicationContext =>
      props.product.name[applicationContext.project.dataLocale]
    }
  />
);
```

```jsx
import { renderApp } from '@commercetools-frontend/application-shell/test-utils';
import { ProductName } from './product-name';

describe('ProductName', () => {
  const partyParrot = {
    name: { en: 'Party Parrot', de: 'Party Papagei' },
  };
  it('should render the product name in the given data locale', async () => {
    const { container } = renderApp(<ProductName product={partyParrot} />, {
      dataLocale: 'en',
    });
    expect(container).toHaveTextContent('Party Parrot');
  });
  it('should render the product name in the given data locale', async () => {
    const { container } = renderApp(<ProductName product={partyParrot} />, {
      dataLocale: 'de',
    });
    expect(container).toHaveTextContent('Party Papagei');
  });
});
```

#### `mocks` (GraphQL)

```jsx
import gql from 'graphql-tag';

export const BankAccountBalanceQuery = gql`
  query BankAccountBalanceQuery {
    account {
      balance
    }
  }
`;
export const BankAccountBalance = props => (
  <Query query={BankAccountBalanceQuery} variables={{ token: props.token }}>
    {payload => {
      if (!payload || !payload.data || !payload.data.account)
        return 'Loading..';
      return `Your balance is ${payload.data.account.balance}€`;
    }}
  </Query>
);
```

```jsx
import { renderApp } from '@commercetools-frontend/application-shell/test-utils';
import {
  BankAccountBalance,
  BankAccountBalanceQuery,
} from './bank-account-balance';

describe('BankAccountBalance', () => {
  it('should render the balance', async () => {
    const { container } = renderApp(<BankAccountBalance token="foo-bar" />, {
      mocks: [
        {
          request: {
            query: BankAccountBalanceQuery,
            variables: { token: 'foo-bar' },
          },
          result: { data: { account: { balance: 300 } } },
        },
      ],
    });
    expect(container).toHaveTextContent('Loading..');
    await wait(() => {
      expect(container).toHaveTextContent('Your balance is 300€');
    });
  });
});
```

#### `sdkMocks` (Redux)

```jsx
import * as globalActions from '@commercetools-frontend/actions-global';

class BankAccountBalance extends React.Component {
  static displayName = 'BankAccountBalance';
  static propTypes = {
    token: PropTypes.string.isRequired,
    // Action creators
    fetchAccountBalance: PropTypes.func.isRequired,
    onActionError: PropTypes.func.isRequired,
  };
  state = {
    isLoading: true,
    accountBalance: null,
  };
  componentDidMount() {
    this.props.fetchAccountBalance(this.props.token).then(
      response => {
        this.setState({
          isLoading: false,
          accountBalance: response.balance,
        });
      },
      error => {
        this.setState({ isLoading: false });
        this.props.onActionError(
          error,
          'BankAccountBalance/fetchAccountBalance'
        );
      }
    );
  }
  render() {
    if (this.state.isLoading) {
      return 'Loading..';
    }
    return `Your balance is ${this.state.accountBalance}€`;
  }
}
const ConnectedBankAccount = connect(
  null,
  {
    fetchAccountBalance: token =>
      sdkActions.get({
        uri: '/account/balance',
        headers: {
          Authorization: token,
        },
      }),
    onActionError: globalActions.handleActionError,
  }
)(BankAccountBalance);
export default ConnectedBankAccount;
```

```jsx
import { renderAppWithRedux } from '@commercetools-frontend/application-shell/test-utils';
import BankAccountBalance from './bank-account-balance';

describe('BankAccountBalance', () => {
  it('should render the balance', async () => {
    const { container } = renderAppWithRedux(
      <BankAccountBalance token="foo-bar" />,
      {
        sdkMocks: [
          {
            action: {
              type: 'SDK',
              payload: {
                method: 'GET',
                uri: '/account/balance',
                headers: {
                  Authorization: 'foo-bar',
                },
              },
            },
            response: {
              balance: 300,
            },
          },
        ],
      }
    );
    expect(container).toHaveTextContent('Loading..');
    await wait(() => {
      expect(container).toHaveTextContent('Your balance is 300€');
    });
  });
});
```

#### `flags` (Feature Flags)

```jsx
const Profile = props => (
  <div>
    {props.name}
    {props.showAge && `(${props.age})`}
  </div>
);

export default injectFeatureToggle('experimentalAgeOnProfileFlag', 'showAge')(
  Profile
);
```

```jsx
import { renderApp } from '@commercetools-frontend/application-shell/test-utils';
import Profile from './profile';

describe('Profile', () => {
  const baseProps = { name: 'Penny', age: 32 };

  it('should show no age when feature is toggled off', () => {
    const { container } = renderApp(<Profile {...baseProps} />, {
      flags: { experimentalAgeOnProfileFlag: false },
    });
    expect(container).toHaveTextContent('Penny');
    expect(container).not.toHaveTextContent('32');
  });

  it('should show age when feature toggle is on', () => {
    const { container } = renderApp(<Profile {...baseProps} />, {
      flags: { experimentalAgeOnProfileFlag: true },
    });
    expect(container).toHaveTextContent('Penny (32)');
  });
});
```

#### Application Context

See the [Basics](#basics) example. The same works for `project` and `environment` as well. Check out [`ApplicationContext`](https://github.com/commercetools/merchant-center-application-kit/blob/master/packages/application-shell-connectors/src/components/application-context/README.md) to learn about the details of `applicationContext` like `user`, `project` and `environment`.

Additionally, there are some top level fields that you can use to change the behaviour of things related to permissions:

- `permissions`: pass a key-value object of normalized permissions that the user should have for the given project.

```js
renderApp(<MyComponent />, {
  permissions: { canManageProjectSettings: true },
});
```

- `actionRights`: (_beta feature_) pass a nested key-value object of normalized action rights that the user should have for the given project.

```js
renderApp(<MyComponent />, {
  actionRights: { products: { canEditPrices: true } },
});
```

- `dataFences`: (_beta feature_) pass a nested key-value object of normalized data fences that the user should have for the given project.

```js
renderApp(<MyComponent />, {
  dataFences: { store: { orders: { canViewOrders: { values: ['store-1'] } } } },
});
```

You can also pass the original shape of the properties listed above to the `project` object:

- `allAppliedPermissions`: pass a list of permissions that the user should have for the given project.
- `allAppliedActionRights`: (_beta feature_) pass a list of action rights that the user should have for the given project.
- `allAppliedDataFences`: (_beta feature_) pass a list of data fences that the user should have for the given project.

```js
renderApp(<MyComponent />, {
  project: {
    allAppliedPermissions: [{ name: 'canManageProjectSettings', value: true }],
    allAppliedActionRights: [
      { group: 'products', name: 'canEditPrices', value: true },
    ],
    allAppliedDataFences: [
      {
        type: 'store',
        group: 'orders',
        name: 'canViewOrders',
        value: 'store-1',
      },
    ],
  },
});
```

#### Example for permissions

```jsx
const DeleteProductButton = () => (
  <RestrictedByPermissions permissions={['ManageProducts']}>
    {({ isAuthorized }) => (
      <button type="button" onClick={() => {}} disabled={!isAuthorized}>
        Delete Product
      </button>
    )}
  </RestrictedByPermissions>
);
```

```jsx
import { renderApp } from '@commercetools-frontend/application-shell/test-utils';
import DeleteProductButton from './delete-product-button';

describe('DeleteProductButton', () => {
  it('should be disabled when the user does not have permission to manage products', () => {
    const { getByText } = renderApp(<DeleteProductButton />, {
      permissions: { canManageProducts: false },
    });
    expect(getByText('Delete Product')).toBeDisabled();
  });
  it('should be enabled when the user has permission to manage products', () => {
    const { getByText } = renderApp(<DeleteProductButton />, {
      permissions: { canManageProducts: true },
    });
    expect(getByText('Delete Product')).not.toBeDisabled();
  });
});
```

#### Router (`react-router`)

```jsx
import { Switch, Route, Redirect } from 'react-router';

export const ProductTabs = () => (
  <Switch>
    <Route path="/products/:productId/general" render={() => 'General'} />
    <Route path="/products/:productId/pricing" render={() => 'Pricing'} />
    {/* Define a catch-all route */}
    <Redirect from="/products/:productId" to="/products/:productId/general" />
  </Switch>
);
```

```jsx
import { renderApp } from '@commercetools-frontend/application-shell/test-utils';
import ProductTabs from './product-tabs';

describe('router', () => {
  it('should redirect to "general" when no tab is given', () => {
    const { container } = renderApp(<ProductTabs />, {
      route: '/products/party-parrot',
    });
    expect(container).toHaveTextContent('General');
  });
  it('should render "general" when on general tab', () => {
    const { container } = renderApp(<ProductTabs />, {
      route: '/products/party-parrot/general',
    });
    expect(container).toHaveTextContent('General');
  });
  it('should render "pricing" when on pricing tab', () => {
    const { container } = renderApp(<ProductTabs />, {
      route: '/products/party-parrot/pricing',
    });
    expect(container).toHaveTextContent('Pricing');
  });
});
```

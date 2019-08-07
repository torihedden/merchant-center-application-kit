import React from 'react';
import PropTypes from 'prop-types';
import { Route, Switch } from 'react-router-dom';
import LockedDiamondSVG from '@commercetools-frontend/assets/images/locked-diamond.svg';
import { MaintenancePageLayout } from '@commercetools-frontend/application-components';
import { InjectReducers } from '@commercetools-frontend/application-shell';
import { useIsAuthorized } from '@commercetools-frontend/permissions';
import OrderDetails from './components/order-details';
import reducers from './reducers';
import { PERMISSIONS } from './constants';

const PageUnauthorized = () => (
  <MaintenancePageLayout
    imageSrc={LockedDiamondSVG}
    title="Not enough permissions to access this resource"
    paragraph1="We recommend to contact your project administrators for further questions."
  />
);

const ApplicationRoutes = props => {
  const canViewOrders = useIsAuthorized({
    demandedPermissions: Object.values(PERMISSIONS),
    shouldMatchSomePermissions: true,
  });
  return (
    <InjectReducers id="orders" reducers={reducers}>
      <Switch>
        <Route
          path={`${props.match.path}/:id`}
          render={routerProps => {
            if (!canViewOrders) {
              return <PageUnauthorized />;
            }
            return <OrderDetails id={routerProps.match.params.id} />;
          }}
        />
      </Switch>
    </InjectReducers>
  );
};
ApplicationRoutes.displayName = 'ApplicationRoutes';
ApplicationRoutes.propTypes = {
  match: PropTypes.shape({
    url: PropTypes.string.isRequired,
    path: PropTypes.string.isRequired,
    params: PropTypes.shape({
      projectKey: PropTypes.string.isRequired,
    }).isRequired,
  }).isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default ApplicationRoutes;

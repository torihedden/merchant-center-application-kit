import React from 'react';
import PropTypes from 'prop-types';
import { injectAuthorized } from '@commercetools-frontend/permissions';
import { PERMISSIONS } from '../../constants';

const OrderDetailsGeneralInfoTab = props => {
  return (
    <div>
      <h1>OrderDetailsGeneralInfoTab</h1>
      <div>
        {props.isAuthorized(props.order) ? (
          <p>you have access</p>
        ) : (
          <p>you do not have access</p>
        )}
      </div>
    </div>
  );
};

OrderDetailsGeneralInfoTab.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string.isRequired,
  }),
  isAuthorized: PropTypes.func.isRequired,
};
OrderDetailsGeneralInfoTab.displayName = 'OrderDetailsGeneralInfoTab';
export default injectAuthorized([PERMISSIONS.ViewOrders], {
  dataFences: [
    {
      type: 'store',
      name: PERMISSIONS.ManageOrders,
      group: 'orders',
    },
  ],
})(OrderDetailsGeneralInfoTab);

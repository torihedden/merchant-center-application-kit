import React from 'react';
import PropTypes from 'prop-types';
import { injectAuthorized } from '@commercetools-frontend/permissions';
import { PERMISSIONS } from '../../constants';

const OrderDetailsGeneralInfoTab = props => {
  if (!props.order) {
    return (
      <div>
        <h1>Not found</h1>
      </div>
    );
  }
  return (
    <div>
      <h1>OrderDetailsGeneralInfoTab</h1>
      <div>
        {props.isAuthorized ? (
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
    storeRef: PropTypes.shape({
      key: PropTypes.string.isRequired,
    }),
  }),
  isAuthorized: PropTypes.bool.isRequired,
};
OrderDetailsGeneralInfoTab.displayName = 'OrderDetailsGeneralInfoTab';
export default injectAuthorized([PERMISSIONS.ManageOrders], {
  dataFences: [
    {
      type: 'store',
      name: PERMISSIONS.ViewOrders,
      group: 'orders',
    },
  ],
  getSelectDataFenceDataByType: ownProps => ({ type }) => {
    switch (type) {
      case 'store':
        return [ownProps.order.storeRef.key];
      default:
        return [];
    }
  },
})(OrderDetailsGeneralInfoTab);

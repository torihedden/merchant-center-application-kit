import React from 'react';
import PropTypes from 'prop-types';
import OrderDetailsConnector from './order-details-connector';
import OrderDetailsGeneralInfoTab from './order-details-general-info-tab';

const OrderDetails = props => {
  return (
    <OrderDetailsConnector orderId={props.id}>
      {({ orderFetcher }) => {
        if (orderFetcher.isLoading) return 'loading';
        if (orderFetcher.error) {
          return (
            <div>
              <React.Fragment>
                error
                <code>{JSON.stringify(orderFetcher.error)}</code>
              </React.Fragment>
            </div>
          );
        }
        return <OrderDetailsGeneralInfoTab order={orderFetcher.order} />;
      }}
    </OrderDetailsConnector>
  );
};
OrderDetails.displayName = 'OrderDetails';
OrderDetails.propTypes = {
  id: PropTypes.string.isRequired,
};
export default OrderDetails;

import React from 'react';
import PropTypes from 'prop-types';
import { graphql } from 'react-apollo';
import flowRight from 'lodash.flowright';
import { FetchOrderDetailsWithDataFence } from './order-details-connector.graphql';
import { withApplicationContext } from '@commercetools-frontend/application-shell-connectors';

export class OrderDetailsConnector extends React.PureComponent {
  static displayName = 'OrderDetailsConnector';
  static propTypes = {
    children: PropTypes.func.isRequired,
    fetchOrderDetailsWithDataFence: PropTypes.shape({
      loading: PropTypes.bool.isRequired,
      order: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }),
      error: PropTypes.any,
    }),
  };
  render() {
    return this.props.children({
      orderFetcher: {
        isLoading: this.props.fetchOrderDetailsWithDataFence.loading,
        order: this.props.fetchOrderDetailsWithDataFence.order,
        error: this.props.fetchOrderDetailsWithDataFence.error,
      },
    });
  }
}

export const createWithDataFenceQueryVariables = ownProps => ({
  // target: <TARGET>,
  target: 'ctp',
  orderId: ownProps.orderId,
  storeKeys: ownProps.storeKeys,
});

export const createWithDataFenceOrderProps = ({
  fetchOrderDetailsWithDataFence,
}) => ({
  fetchOrderDetailsWithDataFence: {
    ...fetchOrderDetailsWithDataFence,
    order: fetchOrderDetailsWithDataFence.inStores
      ? fetchOrderDetailsWithDataFence.inStores.order
      : undefined,
  },
});

export default flowRight(
  withApplicationContext(applicationContext => {
    return {
      storeKeys: Object.entries(applicationContext.dataFences).flatMap(
        ([dataFenceType, resourceGroup]) => {
          if (resourceGroup.orders && dataFenceType === 'store') {
            return Object.values(resourceGroup.orders).flatMap(
              permissionValue => permissionValue.values
            );
          }
        }
      ),
    };
  }),
  graphql(FetchOrderDetailsWithDataFence, {
    name: 'fetchOrderDetailsWithDataFence',
    options: ownProps => ({
      variables: createWithDataFenceQueryVariables(ownProps),
    }),
    props: createWithDataFenceOrderProps,
  })
)(OrderDetailsConnector);

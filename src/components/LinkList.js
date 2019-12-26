import React, { Fragment } from 'react';
import { Query } from 'react-apollo';
import { useHistory } from 'react-router-dom';

import Link from './Link';
import { LINKS_PER_PAGE } from '../constants';
import { FEED_QUERY } from '../constants/queries';
import {
  NEW_LINKS_SUBSCRIPTION,
  NEW_VOTES_SUBSCRIPTION
} from '../constants/subscriptions';

const LinkList = props => {
  const history = useHistory();

  // read the current state of the cached data for the FEED_QUERY from the store
  // retrieving the link that the user just voted for from that list
  // manipulating that link by resetting its votes to the votes that were just returned by the server
  // take the modified data and write it back into the store
  const _updateCacheAfterVote = (store, createVote, linkId) => {
    const isNewPage = props.location.pathname.includes('new');
    const page = parseInt(props.match.params.page, 10);

    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0;
    const first = isNewPage ? LINKS_PER_PAGE : 100;
    const orderBy = isNewPage ? 'createdAt_DESC' : null;
    const data = store.readQuery({
      query: FEED_QUERY,
      variables: { first, skip, orderBy }
    });

    const votedLink = data.feed.links.find(link => link.id === linkId);
    votedLink.votes = createVote.link.votes;

    store.writeQuery({ query: FEED_QUERY, data });
  };

  const _subscribeToNewLinks = async subscribeToMore => {
    // document : subscription query
    // updateQuery : determine how the store should be updated with the information
    // that was sent by the server after the event occurred
    subscribeToMore({
      document: NEW_LINKS_SUBSCRIPTION,
      updateQuery: (prev, { subscriptionData }) => {
        if (!subscriptionData.data) {
          return prev;
        }

        const newLink = subscriptionData.data.newLink;
        const exists = prev.feed.links.find(({ id }) => id === newLink.id);

        if (exists) {
          return prev;
        }

        return Object.assign({}, prev, {
          feed: {
            links: [newLink, ...prev.feed.links],
            count: prev.feed.links.length + 1,
            __typename: prev.feed.__typename
          }
        });
      }
    });
  };

  const _subscribeToNewVotes = subscribeToMore => {
    subscribeToMore({
      document: NEW_VOTES_SUBSCRIPTION
    });
  };

  const _getQueryVariables = () => {
    const isNewPage = props.location.pathname.includes('new');
    const page = parseInt(props.match.params.page, 10);

    const skip = isNewPage ? (page - 1) * LINKS_PER_PAGE : 0;
    const first = isNewPage ? LINKS_PER_PAGE : 100;
    const orderBy = isNewPage ? 'createdAt_DESC' : null;

    return { first, skip, orderBy };
  };

  // calculate the list of links to be rendered in a separate method
  const _getLinksToRender = data => {
    const isNewPage = props.location.pathname.includes('new');

    if (isNewPage) {
      return data.feed.links;
    }

    const rankedLinks = data.feed.links.slice();
    rankedLinks.sort((l1, l2) => l2.votes.length - l1.votes.length);

    return rankedLinks;
  };

  const _previousPage = () => {
    const page = parseInt(props.match.params.page, 10);

    if (page > 1) {
      const previousPage = page - 1;
      history.push(`/new/${previousPage}`);
    }
  };

  const _nextPage = data => {
    const page = parseInt(props.match.params.page, 10);
    if (page <= Math.round(data.feed.count / LINKS_PER_PAGE)) {
      const nextPage = page + 1;
      history.push(`/new/${nextPage}`);
    }
  };

  return (
    <Query query={FEED_QUERY} variables={_getQueryVariables()}>
      {({ loading, error, data, subscribeToMore }) => {
        if (loading) {
          return <div>Fetching</div>;
        }

        if (error) {
          return <div>Error: {JSON.stringify(error)}</div>;
        }

        _subscribeToNewLinks(subscribeToMore);
        _subscribeToNewVotes(subscribeToMore);

        const linksToRender = _getLinksToRender(data);
        const isNewPage = props.location.pathname.includes('new');
        const pageIndex = props.match.params.page
          ? (props.match.params.page - 1) * LINKS_PER_PAGE
          : 0;

        return (
          <Fragment>
            {linksToRender.map((link, index) => (
              <Link
                key={link.id}
                link={link}
                index={index + pageIndex}
                updateCacheAfterVote={_updateCacheAfterVote}
              />
            ))}

            {isNewPage && (
              <div className="flex ml4 mv3 gray">
                <div className="pointer mr2" onClick={_previousPage}>
                  Previous
                </div>
                <div className="pointer" onClick={() => _nextPage(data)}>
                  Next
                </div>
              </div>
            )}
          </Fragment>
        );
      }}
    </Query>
  );
};

export default LinkList;

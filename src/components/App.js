import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';

import LinkList from './LinkList';
import CreateLink from './CreateLink';
import Header from './Header';
import Login from '../views/Login';
import Search from './Search';

function App() {
  return (
    <div>
      <Header />
      <Switch>
        <Route exact path="/" render={() => <Redirect to="/new/1" />} />
        <Route exact path="/create" component={CreateLink} />
        <Route exact path="/login" component={Login} />
        <Route exact path="/search" component={Search} />
        <Route exact path="/top" component={LinkList} />
        <Route exact path="/new/:page" component={LinkList} />
      </Switch>
    </div>
  );
}

export default App;

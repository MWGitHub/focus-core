/**
 * The authenticator is a component which wraps another component.
 * It will redirect to the login page if not authenticated.
 * If authenticated, it will render the passed in component.
 */
import React from 'react';
import AuthStore from '../stores/AuthStore';
import Routes from '../constants/Routes';
import RouterUtil from '../utils/RouterUtil';

/**
 * Wraps the given component in order to prevent overwriting functions.
 * @param {React.Component} Component the component to wrap.
 * @returns {React.Component} the wrapping component.
 * @constructor
 */
function Authenticator(Component) {
    return class AuthenticatorComponent extends React.Component {
        static willTransitionTo(transition) {
            if (!AuthStore.isLoggedIn()) {
                transition.redirect(Routes.login, {}, {'next': transition.path});
            }
        }

        constructor(props) {
            super(props);
            this.state = {
                isLoggedIn: AuthStore.isLoggedIn(),
                jwt: AuthStore.getJWT()
            };
            this._changeListener = null;
        }

        _onChange() {
            if (!AuthStore.isLoggedIn()) {
                RouterUtil.transitionTo('/');
            } else {
                this.setState({
                    isLoggedIn: AuthStore.isLoggedIn(),
                    jwt: AuthStore.getJWT()
                });
            }
        }

        componentDidMount() {
            this._changeListener = this._onChange.bind(this);
            AuthStore.addChangeListener(this._changeListener);
        }

        componentWillUnmount() {
            AuthStore.removeChangeListener(this._changeListener);
        }

        render() {
            return (
                <Component {...this.props} isLoggedIn={this.state.isLoggedIn} jwt={this.state.jwt} />
            )
        }
    };
}

export default Authenticator;
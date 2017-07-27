import React, { Component, PropTypes } from 'react';
import { Container, Button, Message } from 'semantic-ui-react';
import Clipboard from 'clipboard';
import { Field, propTypes } from 'redux-form';

import { StellarTools } from 'stellar-toolkit';
import InputFormField from '../../UiTools/SemanticForm/Input';

const styles = {
  inputContainer: {
    width: '720px',
    maxWidth: '90%',
    margin: 'auto',
  },
};

class AccountSelector extends Component {

  constructor(props) {
    super(props);

    this.state = {
      keypair: null,
      showSeed: false,
      resolving: false,
    };
    if (this.props.keypair) {
      this.state.accountId = this.props.keypair.publicKey();
      this.state.secretSeed = this.props.keypair.canSign() ? this.props.keypair.secret() : '';
    }
  }

  componentWillReceiveProps(newProps) {
    if (this.props.keypair !== newProps.keypair) {
      if (newProps.keypair) {
        this.setState({
          accountId: newProps.keypair.publicKey(),
          secretSeed: newProps.keypair.canSign() ? newProps.keypair.secret() : '',
        });
      } else {
        this.setState({
          accountId: '',
          secretSeed: '',
        });
      }
    }
  }

  componentDidMount() {
    new Clipboard('.account-address-copy'); // eslint-disable-line no-new
  }

  handleAddress(e, newAddress) {
    this.setState({ resolving: true });
    const address = newAddress;

    const isSeed = StellarTools.validSeed(address);
    if (isSeed) {
      const keypair = StellarTools.KeypairInstance({ secretSeed: address });
      this.setState({
        keypair,
        resolving: false,
      });
      return;
    }

    StellarTools.resolveAddress(address)
      .then((resolved) => {
        const keypair = StellarTools.KeypairInstance({ publicKey: resolved.account_id });
        this.setState({
          keypair,
          resolving: false,
        });
      })
      .catch(() => {
        this.setState({
          keypair: null,
          resolving: false,
        });
      });
  }

  handleSet(e) {
    e.preventDefault();
    const keypair = this.state.keypair;
    if (!keypair) return;

    this.props.setAccount(keypair);
  }

  newForm() {
    const { values: { address } } = this.props;

    let buttonLabel = 'Invalid address';
    const buttonContent = 'Go';
    let buttonColor = 'red';
    let disabled = true;
    if (this.state.keypair) {
      buttonColor = 'green';
      disabled = false;
      if (this.state.keypair.canSign()) {
        buttonLabel = 'Seed';
      } else {
        buttonLabel = 'Public address';
      }
    } else if (!address) {
      buttonLabel = 'No address';
    }
    return (
      <div style={styles.inputCntainer}>
        <Field
          name="address"
          component={InputFormField}
          onChange={::this.handleAddress} //17-07-24 ����
          type="text"
          placeholder="Please enter your seed, account ID or federation address."
          error={!!address && !this.state.keypair}
          label={{ content: buttonLabel, width: 3, size: 'large', className: 'AccountSelector-inputTitle' }}
          fluid
          action={{
            color: buttonColor,
            icon: 'sign in',
            disabled,
            content: buttonContent,
            onClick: ::this.handleSet,    // 17-07-24 ����
            loading: this.state.resolving || this.props.isAccountLoading
          }}
        />
      </div>
    );
  }

  /*Top TestNet Or Public Net Form*/
  render() {
    return (
      <div>
        <Container textAlign="center">
          {this.newForm()}
          <br />
          {
            this.props.error ?
              <Message negative>
                <Message.Header>Account error</Message.Header>
                <p>There was an error while fetching this account's data.</p>
                <p>Either the account does not exists or you are on the wrong network.
                  Try to switch to public/testnet.</p>
              </Message>
              :
              null
          }
          {
            this.props.network === 'test' &&
            <div>
              <p style={{ color: 'white' }}>
                Or
              </p>
              <Button
                icon="wizard"
                content="Create new account on testnet"
                color="green"
                loading={this.props.isCreatingTestAccount}
                onClick={this.props.createTestAccount}
              />
            </div>
          }
        </Container>
      </div>
    );
  }
}

AccountSelector.propTypes = {
  isAccountLoading: PropTypes.bool,
  isCreatingTestAccount: PropTypes.bool,
  error: PropTypes.object,
  keypair: PropTypes.object,
  setAccount: PropTypes.func.isRequired,
  createTestAccount: PropTypes.func.isRequired,
  network: PropTypes.string.isRequired,
  ...propTypes,
};

export default AccountSelector;

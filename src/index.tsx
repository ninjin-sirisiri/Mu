import { render } from 'solid-js/web';

/* @refresh reload */
import App from './App';

const root = document.getElementById('root');

if (root !== null) {
  render(() => <App />, root);
}

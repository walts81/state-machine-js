# State-Machine-JS

[![Build Status](https://app.travis-ci.com/walts81/state-machine-js.svg?branch=master)](https://app.travis-ci.com/walts81/state-machine-js)
[![Coverage Status](https://coveralls.io/repos/github/walts81/state-machine-js/badge.svg?branch=master)](https://coveralls.io/github/walts81/state-machine-js?branch=master)
[![NPM Version](https://img.shields.io/npm/v/@walts81/state-machine-js.svg)](https://www.npmjs.com/package/@walts81/state-machine-js)

## Installing State-Machine-JS

Install and add to `dependencies`:

```
npm install --save @walts81/state-machine-js
```

## Using state machines

A state is defined as

```ts
interface State {
  /***
   * The name of the state
   */
  name: string;

  /***
   * The states which must be active in order to transition to this state.
   * This can be an array of state names or the keyword 'any' if this state can be transitioned from any state.
   * All states can be transitioned to (regardless of what is indicated here) if the currentState of the machine is
   *   null (which would be the case if no state is registered as an initial state for the machine)
   */
  allowedFrom: string[] | 'any';

  /***
   * Optional action to run when the state becomes active.
   * Returns a string promise where the string is the next state to trigger when the action is complete.
   * You can return null, undefined, empty string or the same state name to remain on the same state
   */
  action?: (currentState: string) => Promise<string>;
}
```

TypeScript example of an auth state machine with logout after idle for 10 minutes

```ts
const machine = new StateMachine('auth');
const maxIdleInSeconds = 600000;
let idleCounter = 0;
let idleRunning = false;

machine.registerState(
  'idle',
  ['active'],
  () =>
    new Promise<string>(resolve => {
      if (!idleRunning) {
        idleRunning = true;
        const hndl = setInterval(() => {
          if (++idleCounter === maxIdleInSeconds) {
            machine.trigger('logout');
            clearInterval(hndl);
            idleRunning = false;
          }
        }, 1000);
      }
      return resolve('');
    })
);

machine.registerState('active', () => {
  idleCounter = 0;
  return Promise.resolve('idle');
});

machine.registerState(
  'logout',
  currentState => {
    if (!!currentState) {
      // logout implementation here
    }
    return Promise.resolve('');
  },
  true
);

machine.registerState('login', ['logout'], () => {
  // login implementation here
  return Promise.resolve('active');
});

/***
 * This will "start" the machine and trigger whatever state is
 * registered as the initial state (in this case "logout").
 *
 * If no state is registered as the initial state, this effectively does nothing.
 * The machine would still function properly without it but you would be responsible
 * for triggering the initial state.
 */
await machine.start();
```

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
   * The allowed states which this state can be triggered from.
   *
   * This can be an array of state names or the keyword 'any' if it can be triggered from any state.
   * All states can be triggered (regardless of what is indicated here) if the current state of the
   *   machine is null (which would be the case if no state is registered as an initial state for
   *   the machine or if the machine has not been "started")
   */
  allowedFrom: string[] | 'any';

  /***
   * Optional action to run when the state becomes active.
   * The action will get passed a reference to the machine as well as any
   *   args passed to the machine's trigger function.
   *
   * Returns a promise that resolves the name of the next state to trigger.
   *   If a state name is resolved from the promise, it will automatically be
   *     triggered after the action completes.
   *   Otherwise you can return null, undefined, empty string or the same state
   *     name to remain on the same state
   */
  action?: (machine: IStateMachine, ...args: any[]) => Promise<string>;
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
  ['active', 'idle', 'login']
  m => {
    // if coming from login state, it was because login failed
    // so no need to perform logout logic
    if (!!m.currentState && m.currentState !== 'login') {
      // logout implementation here
    }
    return Promise.resolve('');
  },
  true
);

machine.registerState('login', ['logout'], (m: IStateMachine, username: string, password: string) => {
  // login implementation here
  const loginSuccess = password === 'password'; // <-- do real login here
  return loginSuccess ? Promise.resolve('active') : Promise.resolve('logout');
});

/***
 * This will "start" the machine and trigger whatever state is
 *   registered as the initial state (in this case "logout").
 *
 * If no state is registered as the initial state, this effectively does nothing.
 * The machine would still function properly without it but you would be responsible
 *   for triggering the initial state.
 */
await machine.start();

/***
 * You can then use the machine.trigger() function to trigger different states.
 *
 * An error will be thrown if you attempt to trigger a function from a state that
 *   is not listed in the "allowedFrom" of the state you are attempting to trigger
 */
await machine.trigger('login', 'test-user', 'test-password');
```

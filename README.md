# State-Machine-JS

State-Machine-JS is a TypeScript/JavaScript library for creating state machines

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
interface State<T extends object = any> {
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
   * The action will get passed a context containing a reference to the
   *   machine and the previous state. It will also receive any args
   *   that were passed to the machine's trigger function.
   *
   * Returns a promise that resolves an object with name of the next state to trigger
   *   as well as optional data to store in the machine's data.
   *
   *   If a "nextState" is specified in the resolved object, it will automatically be
   *     triggered after the action completes.
   *   Otherwise the nextState value can be undefined, empty string or the same state
   *     name to remain on the same state
   */
  action?: (context: StateActionContext, ...args: any[]) => Promise<StateActionResult<T>>;

  /***
   * Optional action to run to determine if the state can become active.
   * The action will get passed a context containing a reference to the machine.
   *
   * Return a promise that resolves true or false...
   *   true if the state can become active, false if it cannot.
   */
  canTrigger?: (context: StateActionCanTriggerContext, ...args: any[]) => Promise<boolean>;
}

interface StateActionContext {
  machine: IStateMachine;
  previousState: string;
}

interface StateActionCanTriggerContext {
  machine: IStateMachine;
}

interface StateActionResult<T extends object = any> {
  nextState: string;
  data?: T;
}
```

TypeScript example of an auth state machine with logout after idle for 10 minutes

```ts
const initialState = { username: '' };
const machine = new StateMachine('auth', initialState);
const maxIdleInSeconds = 600000;
let idleCounter = 0;
let idleRunning = false;

machine.registerStateWithAction(
  'idle',
  ['active'],
  ctx =>
    new Promise(resolve => {
      if (!idleRunning) {
        idleRunning = true;
        const hndl = setInterval(() => {
          if (++idleCounter === maxIdleInSeconds) {
            ctx.machine.trigger('logout');
            clearInterval(hndl);
            idleRunning = false;
          }
        }, 1000);
      }
      return resolve({ nextState: '' });
    })
);

machine.registerStateWithAction('active', () => {
  idleCounter = 0;
  return new Promise(resolve => setTimeout(() => resolve({ nextState: 'idle' }), 500));
});

machine.registerStateWithAction(
  'logout',
  ['active', 'idle', 'login']
  ctx => {
    // if coming from login state, it was because login failed
    // so no need to perform logout logic
    if (!!ctx.previousState && ctx.previousState !== 'login') {
      // logout implementation here
    }
    return Promise.resolve({ nextState: '', data: { username: '' } });
  },
  true
);

machine.registerStateWithAction(
  'login',
  ['logout'],
  (ctx: StateActionContext, username: string, password: string) => {
    // login implementation here
    const loginSuccess = password === 'password'; // <-- do real login here
    return loginSuccess
      ? Promise.resolve({ nextState: 'active', data: { username } })
      : Promise.resolve({ nextState: 'logout' });
  }
);

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

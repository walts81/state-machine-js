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

<br />

## Using State-Machines-JS

[Walk-through](#walk-through)

[See object definitions](#object-definitions)

[See example](#example)

<br />

## Walk-through

> <h3>Create a machine...</h3>

```ts
import { StateMachine } from '@walts81/state-machine-js';

// with data
const machine = new StateMachine('my-state-machine', {
  info: 'This object is optional but can be used to store data on the machine which can be updated by state actions',
  otherData: {
    nestedInfo: 'more data',
  },
});

// without data
const machine = new StateMachine('my-state-machine');
```

> <h3>Register states</h3>
>
> Use the machine's `registerState` method to add states

```ts
machine.registerState('state1', 'none', true);

machine.registerState('state2', ['state1', 'state3'], async ctx => {
  if (ctx.previousStateName === 'state1') {
    // do something
  } else if (ctx.previousStateName === 'state3') {
    // do something else
  }
  return '';
});

machine.registerState(
  'state3',
  'any',
  async ctx => {
    // do something
    return 'state2';
  },
  async ctx => {
    // optional action to determine if it's ok to trigger this state
    return true;
  }
);
```

> <h3>createState Helper</h3>
>
> Or you can use the `createState` helper to create the state objects and register them separately

```ts
import { createState, StateMachine } from '@walts81/state-machine-js';

const machine = new StateMachine('my-state-machine');
const state1 = createState('state1', 'none');
machine.registerState(state1, true);
const state2 = createState('state2', ['state1'], async ctx => {
  // do something
  return '';
});
machine.registerState(state2);
```

> <h3>Starting the machine</h3>
>
> You can call `machine.start()` and the machine will automatically trigger whatever state was registered as the "initial" state. This is simply a convenience method and serves no other purpose. If no state was registered as the "initial" state, this method won't do anything. You could easily just trigger the first state manually to do the same.

```ts
await machine.start();
// is functionally equivalent to...
await machine.trigger('state1');
```

<br />

## Object Definitions

```ts
interface State<MachineData = any, StateData = any> {
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
  allowedFrom: string[] | 'none' | 'any';

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
  action?: (context: StateActionContext<MachineData>, ...args: any[]) => Promise<StateActionResult<StateData>>;

  /***
   * Optional action to run to determine if the state can become active.
   * The action will get passed a context containing a reference to the machine.
   *
   * Return a promise that resolves true or false...
   *   true if the state can become active, false if it cannot.
   */
  canTrigger?: (context: StateActionContext<MachineData>, ...args: any[]) => Promise<boolean>;
}

interface IStateMachine<MachineData = any> {
  name: string;
  currentStateName: string;
  currentState: State<MachineData> | null;
  data: MachineData;

  registerState<StateData = any>(
    stateOrName: State<MachineData, StateData> | string,
    allowedFrom?: string[] | 'none' | 'any',
    action?: (ctx: StateActionContext<MachineData>, ...args: any[]) => Promise<StateActionResult<StateData>>,
    canTrigger?: (ctx: StateActionContext<MachineData>, ...args: any[]) => Promise<boolean>,
    setAsInitial?: boolean
  ): void;
  canTrigger(state: string, ...args: any[]): Promise<boolean>;
  trigger(state: string, ...args: any[]): Promise<boolean>;
  start(): Promise<void>;
  getStates(): State<MachineData>[];
}

interface StateActionContext<MachineData = any> {
  machine: IStateMachine<MachineData>;
  previousStateName: string;
}

interface StateActionResult<StateData = any> {
  nextStateName: string;
  data?: StateData;
}
```

<br />

## Example

> <h3>TypeScript example of an auth state machine with logout after idle for 10 minutes...</h3>

```ts
const initialState = { username: '' };
const machine = new StateMachine('auth', initialState);
const maxIdleInSeconds = 600000;
let idleCounter = 0;
let idleRunning = false;

machine.registerState(
  'idle',
  ['active'],
  async ctx => {
    if (!idleRunning) {
      idleRunning = true;
      const hndl = setInterval(() => {
        if (++idleCounter === maxIdleInSeconds) {
          clearInterval(hndl);
          idleRunning = false;
          ctx.machine.trigger('logout');
        }
      }, 1000);
    }
    return { nextStateName: '' };
  }
);

machine.registerState('active', () => {
  idleCounter = 0;
  return new Promise(resolve => setTimeout(() => resolve({ nextStateName: 'idle' }), 500));
});

machine.registerState(
  'logout',
  ['active', 'idle', 'login']
  async ctx => {
    // if coming from login state, it was because login failed
    // so no need to perform logout logic
    if (!!ctx.previousStateName && ctx.previousStateName !== 'login') {
      // logout implementation here
    }
    return {
      nextStateName: '',
      data: { username: '' }
    };
  },
  true
);

machine.registerState(
  'login',
  ['logout'],
  async (_, username: string, password: string) => {
    // login implementation here
    const loginSuccess = password === 'password'; // <-- do real login here
    return loginSuccess
      ? { nextStateName: 'active', data: { username } }
      : { nextStateName: 'logout' };
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

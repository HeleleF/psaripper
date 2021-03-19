### PSA Ripper

Learning typescript/node/electron 🧐

## Custom npm script

`npm start` runs `npm-run-all -p ng:serve electron:main`.

1. `ng:serve` and `electron:main` are running in parallel
2. `ng:serve` builds Angular locally and runs it on localhost. Changing the source will automatically recompile and reload the page.
    - note we dont pass the `-o` flag, since we dont want the browser to open (we access localhost through electron's window)
3. `electron:main` starts nodemon, which in turn runs `electron:serve` everytime the electron entrypoint ( the `main.ts` file) changes
    - note we also use `--watch` to watch for changes to the `src/app/shared` directory, because the files in there are imported in `main.ts`
4. Every `electron:serve` call runs `tsc` to compile the electron entrypoint to javascript and then runs `electron` with it. We pass the `--serve` flag to signal a development build.
    - note the command starts with `wait-on tcp:4200`. This is necessary because we cant show the localhost website if it doesnt exist yet (the `ng:serve` isnt done).

# ELECTRON ENTRY POINT

This is the main entry point for electron.
Meaning, to start it manually, you would call `npx electron mainElectron.js`.

The default way from the template repo was to use the `main.js` file directly.
But since we're using modules here, this fails.

### What to do when electron supports ES modules as entry point?

1. Change field main in `package.json` back to simply `'main.js'`
2. Change scripts in `package.json` to `electron .` instead of `electron ./mainElectron.js` (works since electron looks for `main.js` by default)
3. Remove esm (`npm uninstall esm`)
4. Remove this file

### Why does it fail?

Electron does not support ES modules as the main entry point file.
The issue that tracks this seems to be [here](https://github.com/electron/electron/issues/21457).

### The problem is:

1. `main.js` (compiled from `main.ts`) contains the _new_ import statements.
2. Electron fails with `'SyntaxError: Cannot use import statement outside a module'`
3. To fix this, one can change `main.js` to `main.mjs` OR adding `type: 'module'` in `package.json`. (Both solutions mark the js file as a ES module).
4. Now electron fails again with: `'Error [ERR_REQUIRE_ESM]: Must use import to load ES Module: .\main.js'`
5. As long as electron doesnt change its internal requiring code to use import(), using ES modules will therefore fail.

### Solutions:

-   One could change the typescript target back to `es5`, which converts the import statements, therefore resolving the error. (`main.js` is then not a ES module anymore)

-   Another way is described [here](https://github.com/electron/electron/issues/21457#issuecomment-703298653)

We create another file (this one) to act as the new entry point. As can be seen below, we have no import statement here, making this a commonjs file.
The esm package (`npm install esm`) loads our ACTUAL entry point logic and exports it again.

This way we can have a fancy ES module as entry point to electron.

### Created from template:

# Introduction

Bootstrap and package your project with Angular 11 and Electron 11 (Typescript + SASS + Hot Reload) for creating Desktop applications.

Currently runs with:

-   Angular v11.0.3
-   Electron v11.0.3
-   Electron Builder v22.9.1

With this sample, you can :

-   Run your app in a local development environment with Electron & Hot reload
-   Run your app in a production environment
-   Package your app into an executable file for Linux, Windows & Mac

/!\ Hot reload only pertains to the renderer process. The main electron process is not able to be hot reloaded, only restarted.

/!\ Angular 11.x CLI needs Node 10.13 or later to work correctly.

## To build for development

-   **in a terminal window** -> npm start

Voila! You can use your Angular + Electron app in a local development environment with hot reload !

The application code is managed by `main.ts`. In this sample, the app runs with a simple Angular App (http://localhost:4200) and an Electron window.
The Angular component contains an example of Electron and NodeJS native lib import.
You can disable "Developer Tools" by commenting `win.webContents.openDevTools();` in `main.ts`.

## Use Electron / NodeJS / 3rd party libraries

As see in previous chapter, this sample project runs on both mode (web and electron). To make this happens, **you have to import your dependencies the right way**. Please check `providers/electron.service.ts` to watch how conditional import of libraries has to be done when using electron / NodeJS / 3rd party librairies in renderer context (ie. Angular).

## Browser mode

Maybe you only want to execute the application in the browser with hot reload ? Just run `npm run ng:serve:web`.

## Included Commands

| Command                  | Description                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `npm run ng:serve`       | Execute the app in the browser                                                       |
| `npm run build`          | Build the app. Your built files are in the /dist folder.                             |
| `npm run build:prod`     | Build the app with Angular aot. Your built files are in the /dist folder.            |
| `npm run electron:local` | Builds your application and start electron                                           |
| `npm run electron:build` | Builds your application and creates an app consumable based on your operating system |

**Your application is optimised. Only /dist folder and node dependencies are included in the executable.**

## You want to use a specific lib (like rxjs) in electron main thread ?

YES! You can do it! Just by importing your library in npm dependencies section (not **devDependencies**) with `npm install --save`. It will be loaded by electron during build phase and added to your final package. Then use your library by importing it in `main.ts` file. Quite simple, isn't it ?

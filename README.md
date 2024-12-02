# albina-admin-gui

https://admin.avalanche.report/ – A frontend to enter avalanche bulletins.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

```sh
nvm install
corepack enable
yarn install
yarn run start-dev
```

If you encounter Yarn Plug'n'Play errors, make sure there is no `.pnp.cjs` in any folder that could be picked up by yarn (e.g. in your home directory).

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive/pipe/service/class/module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Translation

This project uses Transifex for its translations: https://www.transifex.com/albina-euregio/albina-admin-gui/dashboard/

## Generate CHANGELOG

We use **git-cliff** to generate a changelog from conventional commit messages.
The tool is available from [NPM](https://git-cliff.org/docs/installation/npm) and is available once
you successfully executed `yarn install`. To generate the changelog file use

```sh
yarn git-cliff -o CHANGELOG.md
```

More examples on available command line options can be found [here](https://git-cliff.org/docs/usage/examples)
(Customization)[https://git-cliff.org/docs/configuration/git] is available through the `cliff.toml` file.

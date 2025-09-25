# albina-admin-gui

https://admin.avalanche.report/ – A frontend to enter avalanche bulletins.

## Development server

### First set up

```sh
nvm install
corepack enable
yarn install
```

If you encounter Yarn Plug'n'Play errors, make sure there is no `.pnp.cjs` in any folder that could be picked up by yarn (e.g. in your home directory).

### Run

There are different [environments](src/environments/) defined for different versions of textcat and the server backend.
Once the app is started with one of the environments it is available at `http://localhost:4200/`.
It will automatically reload if you change any of the source files.

#### Start frontend with dev server (admin.avalanche.report/albina_dev)

Use:

```sh
yarn run start-dev
```

#### Start frontend with local server

Follow the instructions for setting up a local development server given in [albina-server](https://gitlab.com/albina-euregio/albina-server/-/blob/master/README.md).
The server should be available under http://localhost:8080/albina.
Then use:

```sh
yarn run start-local
```

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive/pipe/service/class/module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Translation

This project uses Transifex for its translations: https://app.transifex.com/albina-euregio/albina-admin-gui/dashboard/

## Update CHANGELOG (for new releases)

Please use the following workflow when releasing new versions:

1. determine new version number `<TAG>` and
   run `yarn changelog <TAG>`
2. edit `CHANGELOG.md` by hand if necessary and commit
3. create `<TAG>` with git

If you forgot to update the changelog before creating a new tag in git, use
`yarn changelog-latest`. This will add all commits for the newest tag to
the CHANGELOG. The downside compared to the workflow above is, that the
changes to CHANGELOG itself are not included in the release.

If there have been several new releases since the last update to CHANGELOG,
use e.g. `yarn git-cliff -p CHANGELOG.md v7.0.6..` to prepend all changes that
happened _after_ version v7.0.6 was released.

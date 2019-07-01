# Micro Fleet - Microservice

Belongs to Micro Fleet framework. Provides a base class that manages the lifecycle of a (micro)service.

## INSTALLATION

- Stable version: `npm i @micro-fleet/microservice`
- Edge (development) version: `npm i git@github.com:gennovative/micro-fleet-microservice.git`

## DEVELOPMENT

- Install packages in `peerDependencies` section with command `npm i --no-save {package name}@{version}`.

  Otherwise, you directly use neighbor packages by excuting `npm run linkPackages`. It creates symlinks to all directories in `packages/libs`. The symlinks stay in the `{monorepo root}/node_modules/@micro-fleet`.

- `npm run build` to transpile TypeScript then run unit tests (if any) (equiv. `npm run compile` + `npm run test` (if any)).
- `npm run compile`: To transpile TypeScript into JavaScript.
- `npm run watch`: To transpile without running unit tests, then watch for changes in *.ts files and re-transpile on save.
- `npm run test`: To run unit tests.

## RELEASE

- `npm run release`: To transpile and create `app.d.ts` definition file.
- **Note:** Please commit transpiled code in folder `dist` and definition file `app.d.ts` relevant to the TypeScript source code. So that other people can `npm install {git URL}` and use the package without the burden of devDependencies and transpilation.
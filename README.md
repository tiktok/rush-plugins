This repo hosts a collection of third-party plugins for [RushJS](https://rushjs.io).

# rush-init-project-plugin

[![npm](https://img.shields.io/npm/dt/rush-init-project-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-init-project-plugin)
[![npm](https://img.shields.io/npm/dw/rush-init-project-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-init-project-plugin)

When you want to create a new project in your monorepo. There are highly chances you need copy and paste from a project already inside your monorepo. Why not reuse them, like create a project template and used in your monorepo. Yes, `rush-init-project-plugin` is for you!

[More](./rush-plugins/rush-init-project-plugin/README.md)

# rush-upgrade-self-plugin

[![npm](https://img.shields.io/npm/dt/rush-upgrade-self-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-upgrade-self-plugin)
[![npm](https://img.shields.io/npm/dw/rush-upgrade-self-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-upgrade-self-plugin)

When you maintain a Rush.js managed monorepo, and you write some toolkit based on rush related module, such as `microsoft/rush-lib`, `@rushstack/node-core-library`. Things become trivial if you want to upgrade Rush.js to latest version. You need keep the versions of those dependencies in consistency. `rush-upgrade-self-plugin` comes into rescue, it aims to help you upgrade/downgrade Rush.js version in one line.

[More](./rush-plugins/rush-upgrade-self-plugin/README.md)

# rush-sort-package-json

[![npm](https://img.shields.io/npm/dt/rush-sort-package-json.svg?style=flat-square)](https://www.npmjs.com/package/rush-sort-package-json)
[![npm](https://img.shields.io/npm/dw/rush-sort-package-json.svg?style=flat-square)](https://www.npmjs.com/package/rush-sort-package-json)

This plugin leverages the great work of [sort-package-json](https://www.npmjs.com/package/sort-package-json) to sort `package.json` in your monorepo, and keep it consistent.

[More](./rush-plugins/rush-sort-package-json/README.md)

# rush-lint-staged-plugin

[![npm](https://img.shields.io/npm/dt/rush-lint-staged-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-lint-staged-plugin)
[![npm](https://img.shields.io/npm/dw/rush-lint-staged-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-lint-staged-plugin)

Are you finding alternative to `husky` in your monorepo? Rush takes care of Git hooks natively by sync hook scripts under `common/git-hooks/` folder into `.git/hooks`. So, all you need is `lint-staged`. Use this plugin to setup `lint-staged` in your monorepo!

[More](./rush-plugins/rush-lint-staged-plugin/README.md)

# rush-print-log-if-error-plugin

[![npm](https://img.shields.io/npm/dt/rush-print-log-if-error-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-print-log-if-error-plugin)
[![npm](https://img.shields.io/npm/dw/rush-print-log-if-error-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-print-log-if-error-plugin)

Sometimes build errors are collapsed in a remote machine, use this plugin to print the entire log if error occurs.

[More](./rush-plugins/rush-print-log-if-error-plugin/README.md)


# rush-archive-project-plugin

[![npm](https://img.shields.io/npm/dt/rush-archive-project-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-archive-project-plugin)
[![npm](https://img.shields.io/npm/dw/rush-archive-project-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-archive-project-plugin)

After you have tons of project in monorepo, install time gets slower, manage dependencies becomes harder, while some projects are eventually inactive. You just want a way to archive projects properly, and maybe retrieve one day :)
Now, it's time to give this plugin a try!

[More](./rush-plugins/rush-archive-project-plugin/README.md)

# rush-audit-cache-plugin

[![npm](https://img.shields.io/npm/dt/rush-audit-cache-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-audit-cache-plugin)
[![npm](https://img.shields.io/npm/dw/rush-audit-cache-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-audit-cache-plugin)

Use of rush build cache is a great way to speed up your build. But, how to know if the configuration for cache is working as expected? This plugin is for you!

[More](./rush-plugins/rush-audit-cache-plugin/README.md)

# rush-git-lfs-plugin

[![npm](https://img.shields.io/npm/dt/rush-git-lfs-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-git-lfs-plugin)
[![npm](https://img.shields.io/npm/dw/rush-git-lfs-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-git-lfs-plugin)

Git LFS was commonly used to managed large files/binary files in your git repository. This plugin can help you to check if newly added files are correctly managed by Git LFS and prevent users from wrongly commit their local large files.

[More](./rush-plugins/rush-git-lfs-plugin/README.md)

# rush-migrate-subspace-plugin

[![npm](https://img.shields.io/npm/dt/rush-migrate-subspace-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-migrate-subspace-plugin)
[![npm](https://img.shields.io/npm/dw/rush-migrate-subspace-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-migrate-subspace-plugin)

The rush subspace is a new feature that intends to move common projects into 1 workspace. Teams that want to take advantage of this feature need to manually migrate these projects. This script automates most of these required steps to speed up the migration process.

[More](./rush-plugins/rush-migrate-subspace-plugin/README.md)

# rush-dep-graph-plugin

[![npm](https://img.shields.io/npm/dt/rush-dep-graph-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-dep-graph-plugin)
[![npm](https://img.shields.io/npm/dw/rush-dep-graph-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-dep-graph-plugin)

Are you struggling with the complex dependencies between packages? This plugin helps you visualize the dependency relationships between packages.

[More](./rush-plugins/rush-dep-graph-plugin/README.md)

# rush-link-project-plugin

[![npm](https://img.shields.io/npm/dt/rush-link-project-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-link-project-plugin)
[![npm](https://img.shields.io/npm/dw/rush-link-project-plugin.svg?style=flat-square)](https://www.npmjs.com/package/rush-link-project-plugin)

Tired of manually managing local packages in your Rush project? This plugin links your local package to the project, making it easily accessible in other locations.

[More](./rush-plugins/rush-link-project-plugin/README.md)
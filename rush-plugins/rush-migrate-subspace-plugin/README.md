# rush-migrate-subspace-plugin

Rush plugin to migrate an existing project into a subspace.

# Quick Start

1. Enabling this rush plugin

Please follow the [official doc](https://rushjs.io/pages/maintainer/using_rush_plugins/) to enable this plugin in your repo.

2. Running `migrate-subspace`

```
rush migrate-subspace
rush migrate-subspace --report # generates full report
```

If you encounter version inconsistency errors, you can use the migration tool to help you resolve them:

```
rush migrate-subspace --sync
```

# What is the plugin for?

The rush subspace is a new feature that intends to move common projects into 1 workspace. Teams that want to take advantage of this feature need to manually migrate these projects. This script automates most of these required steps to speed up the migration process.

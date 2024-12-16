# rush-dep-graph-plugin

A Rush plugin that displays the dependency graph.

# Prerequisite

Rush.js >= 5.83.2


# Quick Start

1. Enabling this rush plugin

Please follow the [official doc](https://rushjs.io/pages/maintainer/using_rush_plugins/) to enable this plugin in your repo.

2. Running `dep-graph` command

```
Usage: rush dep-graph [OPTIONS]

Options:
  -t, --to <PROJECT_NAME>       Select the packages that depend on specific project.
  -f, --from <PROJECT_NAME>     Select the package that is dependent on specific package.
  --filter <PROJECT_NAME>       Select the packages based on a custom filter criteria, such as specific keywords in the package name.
```

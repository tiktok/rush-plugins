/*
 * This diagram represents a directed graph of dependencies:
 *
 *           +---+
 *           | a |
 *           +---+
 *             |
 *             |
 *             v
 * +---+     +---+
 * | c | <-- | b | <+
 * +---+     +---+  |
 *             |    |
 *             |    |
 *             v    |
 *           +---+  |
 *           | d |  |
 *           +---+  |
 *             |    |
 *             |    |
 *             v    |
 *           +---+  |
 *           | e | -+
 *           +---+
 */

import { ListGraph, Selector } from '../main';
import path from 'path';

describe('ListGraph traversal and output snapshots', () => {
  let oldCwd: string | undefined;

  beforeEach(() => {
    oldCwd = process.cwd();
    const localCwd = path.resolve(__dirname, './repo');
    process.chdir(localCwd);
  });
  afterEach(() => {
    if (oldCwd) {
      process.chdir(oldCwd);
    }
  });

  it('should produce the correct dependency tree with "--to"', async () => {
    const graph = new ListGraph(Selector.To, 'a', 'e');
    const output = await graph.runAsync();
    expect(output).toMatchInlineSnapshot(`
"a
└─┬ b
  └─┬ d
    └── e
"
`);
  });

  it('should produce the correct dependency tree with "--from"', async () => {
    const graph = new ListGraph(Selector.From, 'e', 'b');
    const output = await graph.runAsync();
    expect(output).toMatchInlineSnapshot(`
"e
└─┬ d
  └── b
"
`);
  });

  it('should produce the correct dependency tree in the presence of circular dependencies', async () => {
    const graph = new ListGraph(Selector.To, 'a');
    const output = await graph.runAsync();
    expect(output).toMatchInlineSnapshot(`
"a
└─┬ b
  ├── c
  └─┬ d
    └─┬ e
      └── b[33m (circular)[39m
"
`);
  });
});

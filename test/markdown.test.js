import { test } from 'node:test';
import assert from 'node:assert/strict';
import { markdownToAnnotatedText } from '../dist/services/markdown.js';

test('plain text is emitted as a single checked text part', () => {
  assert.deepEqual(markdownToAnnotatedText('Hello world.'), [{ text: 'Hello world.' }]);
});

test('inline code becomes markup interpreted as a word placeholder', () => {
  assert.deepEqual(markdownToAnnotatedText('Use `foo` here.'), [
    { text: 'Use ' },
    { markup: '`foo`', interpretAs: 'X' },
    { text: ' here.' },
  ]);
});

test('fenced code blocks are skipped entirely', () => {
  const md = '```js\nconst x = 1;\n```';
  assert.deepEqual(markdownToAnnotatedText(md), [{ markup: md, interpretAs: '\n' }]);
});

test('link syntax is markup while the link text stays checked', () => {
  assert.deepEqual(markdownToAnnotatedText('See [the docs](https://example.com) now.'), [
    { text: 'See ' },
    { markup: '[' },
    { text: 'the docs' },
    { markup: '](https://example.com)' },
    { text: ' now.' },
  ]);
});

test('images are markup interpreted as a word placeholder', () => {
  assert.deepEqual(markdownToAnnotatedText('![alt text](img.png) end'), [
    { markup: '![alt text](img.png)', interpretAs: 'X' },
    { text: ' end' },
  ]);
});

test('GFM tables are skipped entirely', () => {
  const md = '| A | B |\n| --- | --- |\n| 1 | 2 |';
  assert.deepEqual(markdownToAnnotatedText(md), [{ markup: md, interpretAs: '' }]);
});

test('list markers are markup, item text stays checked', () => {
  assert.deepEqual(markdownToAnnotatedText('- item one\n- item two'), [
    { markup: '- ' },
    { text: 'item one\n' },
    { markup: '- ' },
    { text: 'item two' },
  ]);
});

test('ordered list markers are markup, item text stays checked', () => {
  assert.deepEqual(markdownToAnnotatedText('1. first\n2. second'), [
    { markup: '1. ' },
    { text: 'first\n' },
    { markup: '2. ' },
    { text: 'second' },
  ]);
});

test('HTML blocks are skipped entirely', () => {
  assert.deepEqual(markdownToAnnotatedText('<div>raw</div>\n\ntext after'), [
    { markup: '<div>raw</div>', interpretAs: '' },
    { text: '\n\ntext after' },
  ]);
});

test('headings and inline emphasis are checked as plain text', () => {
  const md = '# Title\n\nSome **bold** and *italic* text.';
  assert.deepEqual(markdownToAnnotatedText(md), [{ text: md }]);
});

test('empty input produces no parts', () => {
  assert.deepEqual(markdownToAnnotatedText(''), []);
});

test('no empty parts are emitted', () => {
  const parts = markdownToAnnotatedText('`code` and [a link](https://example.com)');
  assert.ok(parts.length > 0);
  for (const part of parts) {
    const value = 'text' in part ? part.text : part.markup;
    assert.ok(value.length > 0, `empty part in ${JSON.stringify(part)}`);
  }
});

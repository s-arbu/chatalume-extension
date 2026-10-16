import { expect, test } from 'bun:test';
import { assertReleaseVersions } from '../scripts/check-release';

test('release versions must agree with an optional version tag', () => {
  expect(() => assertReleaseVersions('0.2.0', '0.2.0', 'v0.2.0')).not.toThrow();
  expect(() => assertReleaseVersions('0.2.0', '0.1.0')).toThrow('manifest');
  expect(() => assertReleaseVersions('0.2.0', '0.2.0', 'v0.1.0')).toThrow('tag');
  expect(() => assertReleaseVersions('0.2.0', '0.2.0', 'main')).toThrow('tag');
});
